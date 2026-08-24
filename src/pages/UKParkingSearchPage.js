const { expect } = require("@playwright/test");
const { pressTab } = require("@utils/dom");
const { SELECTORS: SEARCH_PAGE_SELECTORS } = require("@pages/SearchPage");

/**
 * Page Object for UK parking search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Tab selector
  PARKING_TAB: "#tab-parking",

  // The parking form's own root (parking-search-inputs.vue). Present in BOTH contexts this page
  // object serves — the standalone parking tab and the cart's "Search for Parking" drawer — so
  // everything below is scoped to it rather than to a container that exists in only one.
  PARKING_FORM: 'section.parking-search',

  // Search field
  SEARCH_FIELD_UK_PARKING: "[placeholder=\"Search UK Airport\"]",

  // Date inputs
  PARKING_FROM_DATE_INPUT: "[placeholder=\"Parking from\"]",
  RETURN_DATE_INPUT: "[placeholder=\"Return Date\"]",

  // The day grid inside a visible picker popper — the signal that a DATE calendar is open.
  OPEN_DATE_TABLE: `${SEARCH_PAGE_SELECTORS.DATE_PICKER_PANEL} ${SEARCH_PAGE_SELECTORS.DATE_PICKER_MONTH_TABLE}`,

  // Every date-picker popper regardless of visibility. Element Plus keeps them mounted after
  // close, so "no picker open" has to be a visibility check, not an existence check.
  DATE_PICKER_PANEL_ANY: SEARCH_PAGE_SELECTORS.DATE_PICKER_PANEL.replace(':visible', ''),

  // Time inputs, scoped to the parking form: `[placeholder="Time"]` is page-wide and the sibling
  // Rail form renders six of its own, plus hidden responsive duplicates.
  TIME_INPUTS: 'input.app-timepicker-input',

  // app-timepicker teleports its el-dropdown to <body> with this popper class.
  OPEN_TIME_PICKER_POPPER: '.time-selector-popper:visible',

  // Validation messages, rendered only after a Search click flips `markFields` on
  // (parking-search-inputs.vue). Their presence means the search never ran.
  VALIDATION_MESSAGE: '.help:visible',
};

class UKParkingSearchPage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the parking form root.
   * @returns {import('@playwright/test').Locator}
   */
  getParkingForm() {
    return this.page.locator(SELECTORS.PARKING_FORM).first();
  }

  /**
   * Gets the drop-off time input (first time field).
   * @returns {import('@playwright/test').Locator}
   */
  getDropOffTimePlaceholder() {
    return this.getParkingForm().locator(SELECTORS.TIME_INPUTS).nth(0);
  }

  /**
   * Gets the pickup/return time input (second time field).
   * @returns {import('@playwright/test').Locator}
   */
  getReturnTimePlaceholder() {
    return this.getParkingForm().locator(SELECTORS.TIME_INPUTS).nth(1);
  }

  /**
   * Switches to parking search mode, unless the parking form is already the one on screen.
   *
   * The cart's single-product "Search for Parking" drawer renders only the parking form, with no
   * tab bar to switch. Deciding on the form's own presence rather than on the tab's absence
   * matters: a bare `count()` does not auto-wait, so on the standalone search page a tab bar that
   * has not rendered yet would otherwise be read as "no tab exists", silently skipping the switch
   * and leaving a different product's form in place.
   */
  async clickParkingTab() {
    if (await this.getParkingForm().isVisible().catch(() => false)) {
      return;
    }
    await this.page.locator(SELECTORS.PARKING_TAB).click();
  }

  /**
   * Waits until the parking search form is rendered AND has stopped moving.
   *
   * From the cart's product carousel the form is mounted inside an el-drawer that slides in
   * top-to-bottom (trip-app.vue `.atrs-edit-search-drawer`, direction="ttb") around lazily
   * loaded product inputs. Acting mid-slide is what pushes the date popper partly above the
   * viewport's top edge and detaches fields under Playwright's stability retries, so wait for
   * the airport input's position to settle before touching any field.
   *
   * @param {number} [timeout=30000] - Max wait for the form to render
   * @param {number} [settleTimeout=5000] - Max wait for its position to stop changing
   */
  async waitForSearchFormReady(timeout = 30000, settleTimeout = 5000) {
    const airportInput = this.page.locator(SELECTORS.SEARCH_FIELD_UK_PARKING).first();
    await airportInput.waitFor({ state: 'visible', timeout });

    let previousBox = null;
    const deadline = Date.now() + settleTimeout;
    while (Date.now() < deadline) {
      const box = await airportInput.boundingBox();
      if (
        box && previousBox
        && box.x === previousBox.x && box.y === previousBox.y
        && box.width === previousBox.width && box.height === previousBox.height
      ) {
        return;
      }
      previousBox = box;
      await this.page.waitForTimeout(100);
    }

    throw new Error(
      `[UKParkingSearchPage.waitForSearchFormReady] The parking search form kept moving for ` +
      `${settleTimeout}ms — the drawer slide-in never settled, so its fields are not safe to ` +
      `interact with.`
    );
  }

  /**
   * Types the UK airport name into the search field and commits it by blurring.
   *
   * Waits on the field's own value rather than sleeping for the blur to be processed: the input is
   * bound to the Vuelidate model, so a retained value is the signal the commit landed. An empty
   * field here means the search would fail the required-origin validation, which is far cheaper to
   * report at this step than as a rejected submit several steps later.
   *
   * @param {string} airport - Airport name or code to search for
   * @throws {Error} If the field does not retain the typed value
   */
  async typeUKAirport(airport) {
    const airportInput = this.page.locator(SELECTORS.SEARCH_FIELD_UK_PARKING).first();
    await airportInput.fill(airport);

    // Commit the value (blur the field)
    await pressTab(this.page);

    try {
      await expect.poll(
        async () => (await airportInput.inputValue()).trim(),
        { timeout: 10000 },
      ).not.toBe('');
    } catch (error) {
      throw new Error(
        `[UKParkingSearchPage.typeUKAirport] The airport field did not retain "${airport}" after ` +
        `blurring, so the origin never committed. Original: ${error.message}`
      );
    }
  }

  /**
   * Reads the UK airport field's current value without waiting for it to be set.
   * @returns {Promise<string>} The current value, empty string when unset
   */
  async getUKAirportValue() {
    return (await this.page.locator(SELECTORS.SEARCH_FIELD_UK_PARKING).first().inputValue()).trim();
  }

  /**
   * Waits for the UK airport field to hold a value, and returns it.
   *
   * When the parking form is opened from the cart it is pre-populated from the trip's existing
   * search suggestion (getTripSearchSuggestions), which lands on the field asynchronously after
   * the drawer has already rendered. Waiting on the value rather than reading it once is what
   * separates "not populated yet" from "not populated at all".
   *
   * @param {number} [timeout=10000] - How long to wait for a non-empty value
   * @returns {Promise<string>} The committed value
   * @throws {Error} If the field is still empty when the timeout elapses
   */
  async waitForUKAirportFilled(timeout = 10000) {
    await this.page.waitForFunction(
      (selector) => {
        const input = document.querySelector(selector);
        return !!input && input.value.trim().length > 0;
      },
      SELECTORS.SEARCH_FIELD_UK_PARKING,
      { timeout },
    );

    return this.getUKAirportValue();
  }

  /**
   * Waits until no date-picker popper is open.
   *
   * Arrival and return are two independent single-date pickers, and callers select days from the
   * FIRST visible panel — so the previous field's popper must be gone, not merely closing, or its
   * panel silently absorbs the clicks meant for this one. Counting panels in-page is deliberate:
   * waiting on the bare panel locator raises a strict-mode violation for the multi-panel case,
   * which is exactly the case being guarded against.
   *
   * @param {number} [timeout=5000]
   */
  async waitForNoOpenDatePicker(timeout = 5000) {
    // Element Plus keeps a closed popper mounted, so visibility has to be measured (no client
    // rects == display:none) rather than inferred from the element merely existing.
    await this.page.waitForFunction(
      (selector) => Array.from(document.querySelectorAll(selector))
        .every((panel) => panel.getClientRects().length === 0),
      SELECTORS.DATE_PICKER_PANEL_ANY,
      { timeout },
    );
  }

  /**
   * Opens a date field's calendar popper and waits for its day grid to render.
   *
   * Element Plus auto-opens the picker when focus lands on the input (a Tab out of the previous
   * field is enough) and mirrors that state onto the input as aria-expanded. Clicking an
   * already-open input aims at a point the popper's own date cell now covers, so the click can
   * neither reach the input nor dismiss the popper and hangs until timeout. The auto-open is
   * therefore given a grace period first, and the input is clicked only if it stays shut — a
   * plain "check, then click" would still hang when the picker opens between the two.
   *
   * Waiting on THIS input's aria-expanded rather than on any visible panel is what guarantees the
   * panel the caller then picks days from belongs to this field.
   *
   * @param {string} inputSelector - Placeholder selector for the date input
   */
  async openDatePicker(inputSelector) {
    const input = this.page.locator(inputSelector).first();
    await input.waitFor({ state: 'visible', timeout: 15000 });

    // Element Plus currently renders role="combobox"/aria-expanded on the <input> itself, but it
    // routes those attributes through el-input's containerAttrs, so a version bump could move them
    // onto the `.el-date-editor` wrapper instead. Match either placement so this does not silently
    // become a guaranteed 10s throw on upgrade.
    const expandedInput = this.page
      .locator(`${inputSelector}[aria-expanded="true"], [aria-expanded="true"]:has(${inputSelector})`)
      .first();

    try {
      await expandedInput.waitFor({ state: 'attached', timeout: 1000 });
    } catch {
      await input.click();
      try {
        await expandedInput.waitFor({ state: 'attached', timeout: 10000 });
      } catch (error) {
        throw new Error(
          `[UKParkingSearchPage.openDatePicker] The calendar for "${inputSelector}" never opened — ` +
          `the input never reported aria-expanded="true". Original: ${error.message}`
        );
      }
    }

    await this.page
      .locator(SELECTORS.OPEN_DATE_TABLE)
      .first()
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Opens the parking start date calendar picker.
   */
  async clickParkingFromDateField() {
    await this.openDatePicker(SELECTORS.PARKING_FROM_DATE_INPUT);
  }

  /**
   * Opens the return date calendar picker.
   */
  async clickReturnDateField() {
    await this.openDatePicker(SELECTORS.RETURN_DATE_INPUT);
  }

  /**
   * Waits for a date input to actually hold a value, and returns it.
   *
   * Clicking a day cell is fire-and-forget: Element Plus commits the value only when the click
   * reaches the panel that belongs to THIS input, so a click that landed on a foreign or closing
   * popper leaves the field silently empty. The input's own value is the only signal that the
   * pick stuck — the day cell reporting itself as clicked is not.
   *
   * @param {string} inputSelector - Placeholder selector for the date input
   * @param {number} [timeout=5000] - How long to wait for a non-empty value
   * @returns {Promise<string>} The committed value
   */
  async waitForDateInputFilled(inputSelector, timeout = 5000) {
    await this.page.waitForFunction(
      (selector) => {
        const input = document.querySelector(selector);
        return !!input && input.value.trim().length > 0;
      },
      inputSelector,
      { timeout },
    );

    return this.getDateInputValue(inputSelector);
  }

  /**
   * Waits for a date input's value to become something other than `previousValue`, and returns it.
   *
   * The counterpart to waitForDateInputFilled, for the edit-search drawer: there both dates open
   * pre-filled from the search that produced the results behind the drawer, so "holds a value"
   * proves nothing about the pick. Only a CHANGED value proves the day-cell click reached this
   * field's own panel rather than a foreign or closing one — without it a swallowed click leaves a
   * perfectly valid form that silently re-runs the original search.
   *
   * @param {string} inputSelector - Placeholder selector for the date input
   * @param {string} previousValue - The value the field held before the pick
   * @param {number} [timeout=5000] - How long to wait for the value to change
   * @returns {Promise<string>} The newly committed value
   */
  async waitForDateInputChanged(inputSelector, previousValue, timeout = 5000) {
    await this.page.waitForFunction(
      ({ selector, previous }) => {
        const input = document.querySelector(selector);
        if (!input) return false;
        const value = input.value.trim();
        return value.length > 0 && value !== previous;
      },
      { selector: inputSelector, previous: previousValue },
      { timeout },
    );

    return this.getDateInputValue(inputSelector);
  }

  /**
   * Waits for the parking start date to hold a value other than `previousValue`.
   * @returns {Promise<string>}
   */
  async waitForParkingFromDateChanged(previousValue, timeout = 5000) {
    return this.waitForDateInputChanged(SELECTORS.PARKING_FROM_DATE_INPUT, previousValue, timeout);
  }

  /**
   * Waits for the return date to hold a value other than `previousValue`.
   * @returns {Promise<string>}
   */
  async waitForReturnDateChanged(previousValue, timeout = 5000) {
    return this.waitForDateInputChanged(SELECTORS.RETURN_DATE_INPUT, previousValue, timeout);
  }

  /**
   * Reads a date input's current value without waiting for it to be set.
   * @param {string} inputSelector - Placeholder selector for the date input
   * @returns {Promise<string>} The current value, empty string when unset
   */
  async getDateInputValue(inputSelector) {
    return (await this.page.locator(inputSelector).first().inputValue()).trim();
  }

  /**
   * Waits for the parking start date to hold a value. @returns {Promise<string>}
   */
  async waitForParkingFromDateFilled(timeout = 5000) {
    return this.waitForDateInputFilled(SELECTORS.PARKING_FROM_DATE_INPUT, timeout);
  }

  /**
   * Waits for the return date to hold a value. @returns {Promise<string>}
   */
  async waitForReturnDateFilled(timeout = 5000) {
    return this.waitForDateInputFilled(SELECTORS.RETURN_DATE_INPUT, timeout);
  }

  /**
   * Reads the parking start date's current value. @returns {Promise<string>}
   */
  async getParkingFromDateValue() {
    return this.getDateInputValue(SELECTORS.PARKING_FROM_DATE_INPUT);
  }

  /**
   * Ensures a time field holds a value, priming it only when it is empty.
   *
   * Both times are required. Which path applies depends on context, so neither can be assumed:
   *  - From the cart, `getTripSearchSuggestions` returns the existing trip's dates and
   *    parking-search-inputs.vue prefills both times — nothing to do.
   *  - On a brand-new trip there is no suggestion, so the parking store's initial empty strings
   *    remain and the field must be primed.
   *
   * Priming means opening and closing the picker: app-timepicker's `close()` defaults an empty
   * value to "00:00". Both the open and the close are awaited on the popper's actual state — a
   * dblclick is not equivalent, as it can leave the popper (and its minute dropdown) open, which
   * then covers the Search button and swallows the submit click.
   *
   * @param {import('@playwright/test').Locator} timeInput - The time field to prime
   * @param {string} label - Field name used in the thrown error
   * @returns {Promise<string>} The field's committed value
   */
  async ensureTimeIsSet(timeInput, label) {
    await timeInput.waitFor({ state: 'visible', timeout: 15000 });

    const existingValue = (await timeInput.inputValue()).trim();
    if (existingValue) {
      return existingValue;
    }

    const openPopper = this.page.locator(SELECTORS.OPEN_TIME_PICKER_POPPER).first();
    await timeInput.click();
    await openPopper.waitFor({ state: 'visible', timeout: 10000 });

    // el-dropdown uses trigger="click", so clicking the input again toggles it shut, which is what
    // fires the close() handler that commits the default.
    await timeInput.click();
    await openPopper.waitFor({ state: 'hidden', timeout: 10000 });

    const primedValue = (await timeInput.inputValue()).trim();
    if (!primedValue) {
      throw new Error(
        `[UKParkingSearchPage.ensureTimeIsSet] The ${label} time is still empty after opening and ` +
        `closing its picker, so the search will fail the form's required-time validation.`
      );
    }

    return primedValue;
  }

  /**
   * Ensures the drop-off (arrival) time is set. @returns {Promise<string>}
   */
  async ensureDropOffTimeIsSet() {
    return this.ensureTimeIsSet(this.getDropOffTimePlaceholder(), 'drop-off');
  }

  /**
   * Ensures the return (departure) time is set. @returns {Promise<string>}
   */
  async ensureReturnTimeIsSet() {
    return this.ensureTimeIsSet(this.getReturnTimePlaceholder(), 'return');
  }

  /**
   * Reads the validation messages the form renders after a rejected Search click.
   * Empty array means the form raised nothing.
   * @returns {Promise<string[]>}
   */
  async getValidationMessages() {
    const messages = this.getParkingForm().locator(SELECTORS.VALIDATION_MESSAGE);
    if ((await messages.count()) === 0) {
      return [];
    }
    return (await messages.allTextContents()).map((text) => text.trim()).filter(Boolean);
  }

  /**
   * Waits for the outcome of a Search click: either the results route is entered or the form
   * renders a validation message. Racing the two means the happy path costs no fixed delay and a
   * rejected submit is caught immediately rather than as an opaque downstream step timeout.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<'results'|'rejected'>}
   */
  async waitForSearchOutcome(timeout = 15000) {
    const reachedResults = this.page
      .waitForURL(/parking\/results/, { timeout })
      .then(() => 'results');

    const wasRejected = this.getParkingForm()
      .locator(SELECTORS.VALIDATION_MESSAGE)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => 'rejected');

    try {
      return await Promise.race([reachedResults, wasRejected]);
    } catch (error) {
      throw new Error(
        `[UKParkingSearchPage.waitForSearchOutcome] After the Search click the parking results ` +
        `route was never entered and the form raised no validation message within ${timeout}ms. ` +
        `Original: ${error.message}`
      );
    }
  }
}

module.exports = UKParkingSearchPage;
