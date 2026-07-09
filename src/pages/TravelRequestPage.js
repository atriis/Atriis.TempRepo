/**
 * Page Object for travel request page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  FLIGHT_SERVICE_BUTTON: ".product-btn",
  FLIGHT_SEARCH_INPUTS: ".flight-search-inputs",
  DEPARTURE_DATE_INPUT: "input[placeholder*='Depart']",

  // Requested-item card title in travel-request quotes (general-product-card.vue ~L37-38):
  // h5.center-title inside .quote-names-container renders "{{ $t('common.requested') }} {{ quote.productName }} ...",
  // e.g. "Requested Flight to Tel Aviv". No data-testid/role exists here, so match structurally by CSS
  // and filter by text (e.g. "Requested") at call time.
  REQUESTED_ITEM_CARD_TITLE: '.quote-names-container h5.center-title',

  // Trip Reference Form modal that opens AFTER clicking "Send request" for travellers with
  // mandatory reference questions (e.g. privileged users). Its "Save" button is the same
  // element the DSL clicks next to submit the reference answers and proceed to "Sent to agent"
  // (see TravelRequest.sendFlightTravelRequest). The button intercepts pointer events on the
  // "Send request" button while open, so its appearance = the Send-request click registered.
  // TODO: identical to CommonPage.SAVE_BUTTON ("button:has-text('Save')") which the DSL already
  // clicks via CommonPage.getSaveButton() — consolidate to one shared source of truth.
  REFERENCE_FORM_SAVE_BUTTON: "button:has-text('Save')",

  // ===== Request-assistance review form (request-assistance.vue) =====
  // Root container of the travel-request review form.
  REQUEST_ASSISTANCE_MAIN: ".request-assistance-main",
  // "Who are the travellers?" section heading (.travelers-container h6).
  TRAVELERS_TITLE: ".request-assistance-main .travelers-container h6",
  // Per-product item title, e.g. "Flight" / "Hotel" (h4.product-name inside each search-inputs item).
  PRODUCT_NAME: ".request-assistance-main .search-inputs-container h4.product-name",

  // Flight item — the flight-search-inputs component renders inside the flight request item.
  // Origin/destination are airport-autocomplete inputs (value = airport Name); the round-trip
  // basic layout renders an app-daterange whose two el-range-inputs carry the Depart/Return
  // placeholders. Placeholders come from i18n (autocomplete.fromFlightDeparture / .toFlightDestination,
  // flight.departDate / flight.returnDate) and are stable across releases.
  FLIGHT_ORIGIN_INPUT: ".request-assistance-main .flight-search-inputs [placeholder='From... Departure']",
  FLIGHT_DESTINATION_INPUT: ".request-assistance-main .flight-search-inputs [placeholder='To... Destination']",
  FLIGHT_DEPART_DATE_INPUT: ".request-assistance-main .flight-search-inputs [placeholder='Depart Date']",
  FLIGHT_RETURN_DATE_INPUT: ".request-assistance-main .flight-search-inputs [placeholder='Return Date']",
  // Cabin-class selector (flight-search-inputs.vue .class-input app-select bound to flightRows[0].class).
  // It renders even in requestAssistance mode (only the travelers-count/search-for selects are gated out),
  // so the entered cabin class carries into the request form. The el-select shows the selected label in
  // .el-select__selection (Element Plus 2.x).
  FLIGHT_CABIN_CLASS: ".request-assistance-main .flight-search-inputs .class-input .el-select__selection",

  // Travellers section (request-assistance.vue .travelers-container → trip-travelers-list → one
  // trip-traveler-tag per traveler). Named (non-empty) travellers carry .traveler-name.black, while an
  // empty "Select traveller" slot uses .traveler-name.has-text-weight-semibold — count only the named ones.
  TRAVELERS_CONTAINER: ".request-assistance-main .travelers-container",
  TRAVELER_TAG_NAMED: ".request-assistance-main .travelers-container .trip-traveler-tag .traveler-name.black",

  // Hotel item — the hotel-search-inputs component renders inside the hotel request item.
  // Destination is a hotel-autocomplete input (value = destination Name); check-in/check-out are
  // the app-daterange el-range-inputs carrying the hotel.checkIn / hotel.checkOut placeholders.
  HOTEL_DESTINATION_INPUT: ".request-assistance-main .hotel-search-inputs .hotel-autocomplete-wrapper input",
  HOTEL_CHECK_IN_INPUT: ".request-assistance-main .hotel-search-inputs [placeholder='Check in']",
  HOTEL_CHECK_OUT_INPUT: ".request-assistance-main .hotel-search-inputs [placeholder='Check out']",

  // ===== Per-item comment textarea (request-assistance.vue L69-75) =====
  // Each request-assistance item (.search-inputs-container) renders its own always-visible
  // el-input.product-textarea. Scoped per product via the item's *-search-inputs child class.
  ITEM_COMMENT_TEXTAREA: ".product-textarea textarea",

  // ===== Car request item (car-search-inputs.vue) =====
  // uniqueClass="pick-up" is applied to the autocomplete input; placeholders come from i18n
  // car.pickUpDate/dropOffDate and are stable across releases.
  CAR_PICKUP_LOCATION_INPUT: ".car-search-inputs .pick-up input",
  CAR_PICKUP_DATE_INPUT: ".car-search-inputs [placeholder='Pick-up Date']",
  CAR_DROPOFF_DATE_INPUT: ".car-search-inputs [placeholder='Drop-off Date']",
  // Pick-up/drop-off times are left at the form's valid defaults (10:00), so no time-input
  // selectors are needed here.

  // ===== Rail request item (eu-rail-search-inputs.vue — its own root class is eu-rail-search-inputs) =====
  RAIL_ORIGIN_INPUT: ".eu-rail-search-inputs [placeholder='From... Station or Location']",
  RAIL_DESTINATION_INPUT: ".eu-rail-search-inputs [placeholder='To... Station or Location']",
  RAIL_DEPARTURE_DATE_INPUT: ".eu-rail-search-inputs [placeholder='Departure']",
  RAIL_RETURN_DATE_INPUT: ".eu-rail-search-inputs [placeholder='Return']",

  // ===== Autocomplete suggestion poppers (app-autocomplete.vue) =====
  // Car uses the shared app-autocomplete-popper; rail adds boxed-autocomplete-popper. Each
  // suggestion row renders as .autocomplete-result. Only one popper is open at a time here.
  AUTOCOMPLETE_POPPER: ".app-autocomplete-popper",
  RAIL_AUTOCOMPLETE_POPPER: ".boxed-autocomplete-popper",
  AUTOCOMPLETE_RESULT_ITEM: ".autocomplete-result",

  // ===== Requested-item comment on the trip Requests tab (general-product-card.vue L138-143) =====
  // The traveller comment renders in .traveler-comment p (its text is the entered comment, or a
  // "No special request" fallback when empty). Comments in this scenario are unique per product.
  REQUESTED_ITEM_COMMENT: ".traveler-comment p",
};

// Maps a request-assistance product noun to the stable root class of its search-inputs child, so
// the per-item comment textarea can be scoped to the correct item.
const PRODUCT_SEARCH_INPUTS_CLASS = {
  hotel: "hotel-search-inputs",
  car: "car-search-inputs",
  rail: "eu-rail-search-inputs",
};

// Maps a request-assistance field key to its selector. One entry per readable field so the getters
// are a single map-driven pair instead of seven near-identical wrappers.
const REQUEST_FIELD_SELECTORS = {
  flightOrigin: SELECTORS.FLIGHT_ORIGIN_INPUT,
  flightDestination: SELECTORS.FLIGHT_DESTINATION_INPUT,
  flightDepartDate: SELECTORS.FLIGHT_DEPART_DATE_INPUT,
  flightReturnDate: SELECTORS.FLIGHT_RETURN_DATE_INPUT,
  hotelDestination: SELECTORS.HOTEL_DESTINATION_INPUT,
  hotelCheckIn: SELECTORS.HOTEL_CHECK_IN_INPUT,
  hotelCheckOut: SELECTORS.HOTEL_CHECK_OUT_INPUT,
};

class TravelRequestPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks the "Flight" service button in the "Add more services" section.
   * This renders the flight-search-inputs form.
   */
  async clickFlightButton() {
    await this.clickAddServiceButton('Flight');
  }

  /**
   * Waits for the flight-search-inputs form to be visible after clicking the Flight button.
   */
  async waitForFlightSearchInputs() {
    await this.page
      .locator(SELECTORS.FLIGHT_SEARCH_INPUTS)
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Opens the departure date picker in the Travel Request flight form.
   * Checks if the picker is already open (TAB from To field may auto-open it)
   * to avoid a toggle-close by clicking an already-open picker.
   */
  async clickDepartureDateField() {
    const panel = this.page.locator('.el-picker-panel');

    // If picker is already open (e.g. TAB from To field focused this input), don't click again
    const isAlreadyOpen = await panel.isVisible().catch(() => false);

    if (!isAlreadyOpen) {
      const field = this.page.locator(SELECTORS.DEPARTURE_DATE_INPUT).first();
      await field.scrollIntoViewIfNeeded();
      await field.click();
      await panel.first().waitFor({ state: 'visible', timeout: 10000 });
    }

    // Wait for Popper.js to finish repositioning the floating panel
    await this.page.waitForTimeout(600);
  }

  /**
   * Gets the "Send request" button locator.
   */
  getSendRequestButton() {
    return this.page.getByRole("button", { name: "Send request" });
  }

  /**
   * Waits for the "Send request" button to be visible AND enabled, clicks it,
   * then confirms the click actually registered.
   *
   * A registered click produces one of two UI signals (both mean "proceed"):
   *  - the "Send request" button detaches (flows without reference questions submit directly), OR
   *  - the Trip Reference Form modal opens (its "Save" button becomes visible) so the DSL can
   *    submit the mandatory reference answers next (see TravelRequest.sendFlightTravelRequest).
   *
   * If NEITHER signal appears within ~8s the click did not register (no modal is open, so a
   * single retry click is safe). If it still fails after the retry the form did not submit —
   * most likely a validation error such as an uncommitted airport field — and a descriptive
   * error is thrown instead of a naked downstream timeout.
   */
  // TODO: this method carries submit-confirmation workflow (race + guarded retry) that ideally
  // belongs in the DSL (TravelRequest.sendFlightTravelRequest); kept here for now so the page
  // exposes a single "click Send request and confirm it took" action. Revisit if the DSL grows.
  async clickSendRequestButton() {
    const button = this.getSendRequestButton();

    // Wait until the button is visible; the click below auto-waits for it to be enabled/actionable,
    // so we avoid a point-in-time isEnabled() check that would false-throw on transient validation.
    await button.waitFor({ state: 'visible', timeout: 15000 });

    // First click. Bounded timeout so a blocked click fails fast (not the 30s default).
    await button.click({ timeout: 15000 });

    if (await this._sendRequestClickRegistered(10000)) return;

    // No success signal yet. Only retry if the click genuinely did NOT register: the reference-form
    // Save modal must be closed AND the Send request button still present. Retrying while the modal
    // is open (a slow-but-successful submit) would double-submit the travel request or click into an
    // overlay — a real cost risk for flight requests.
    const referenceModalOpen = await this.page
      .locator(SELECTORS.REFERENCE_FORM_SAVE_BUTTON)
      .first()
      .isVisible()
      .catch(() => false);
    const buttonStillPresent = await button.isVisible().catch(() => false);
    if (referenceModalOpen || !buttonStillPresent) return; // submit already in progress — do not re-click

    await button.click({ timeout: 10000 });
    if (await this._sendRequestClickRegistered(10000)) return;

    throw new Error(
      "[TravelRequestPage.clickSendRequestButton] The travel-request form did not submit. " +
        "WHAT: the 'Send request' button neither detached nor opened the Trip Reference Form " +
        "(no 'Save' modal appeared). WHERE: travel-request review page. WHY: the form most likely " +
        "has a validation error (e.g. an uncommitted airport field), preventing submission."
    );
  }

  /**
   * Resolves true as soon as the Send-request click has registered — i.e. either the
   * "Send request" button detaches OR the Trip Reference Form "Save" button appears — within
   * `timeout` ms; resolves false if neither happens in time. Internal helper; adds no public API.
   *
   * @param {number} timeout - Max time (ms) to wait for a confirmation signal.
   * @returns {Promise<boolean>}
   */
  async _sendRequestClickRegistered(timeout) {
    const detached = this.getSendRequestButton()
      .waitFor({ state: 'hidden', timeout })
      .then(() => true)
      .catch(() => false);
    const referenceModal = this.page
      .locator(SELECTORS.REFERENCE_FORM_SAVE_BUTTON)
      .first()
      .waitFor({ state: 'visible', timeout })
      .then(() => true)
      .catch(() => false);

    // Whichever signal appears first wins; the loser's promise settles later and is caught.
    return Promise.race([detached, referenceModal]);
  }

  /**
   * Gets the "Sent to agent" confirmation message locator.
   */
  getSentToAgentMessage() {
    return this.page.getByText("Sent to agent", { exact: true });
  }

  async waitForSentToAgentMessage() {
    await this.getSentToAgentMessage().waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Gets the requested-item card title locator filtered by the given text.
   * Targets the travel-request quote card title (general-product-card.vue), e.g.
   * "Requested Flight to Tel Aviv", scoped to titles whose text contains `text`.
   *
   * @param {string} text - Text the card title must contain (e.g. "Requested")
   * @returns {import('@playwright/test').Locator}
   */
  getRequestedItemCardTitle(text) {
    if (!text || typeof text !== "string") {
      throw new Error(`text must be a non-empty string, got: ${typeof text}`);
    }
    return this.page.locator(SELECTORS.REQUESTED_ITEM_CARD_TITLE).filter({ hasText: text });
  }

  // ===== Request-assistance review form getters =====

  /**
   * Gets the "Who are the travellers?" section-title locator in the request-assistance form.
   * @returns {import('@playwright/test').Locator}
   */
  getTravelersSectionTitle() {
    return this.page.locator(SELECTORS.TRAVELERS_TITLE);
  }

  /**
   * Gets the product-title locator (e.g. "Flight" / "Hotel") for a product in the request-assistance
   * form, filtered by the product label.
   * @param {string} product - Product label the title must contain (e.g. "Flight")
   * @returns {import('@playwright/test').Locator}
   */
  getProductTitle(product) {
    if (!product || typeof product !== "string") {
      throw new Error(`product must be a non-empty string, got: ${typeof product}`);
    }
    return this.page.locator(SELECTORS.PRODUCT_NAME, { hasText: product });
  }

  /**
   * Resolves the selector for a request-assistance field key, throwing on an unknown key so a typo
   * fails loudly rather than silently reading nothing.
   * @param {string} fieldKey - One of the keys in REQUEST_FIELD_SELECTORS (e.g. "flightOrigin")
   * @returns {string}
   */
  _requestFieldSelector(fieldKey) {
    const selector = REQUEST_FIELD_SELECTORS[fieldKey];
    if (!selector) {
      throw new Error(
        `[TravelRequestPage] Unknown request-assistance field key "${fieldKey}". Known keys: ${Object.keys(REQUEST_FIELD_SELECTORS).join(", ")}.`
      );
    }
    return selector;
  }

  /**
   * Gets the locator for a request-assistance field, so callers can check presence (count) to tell
   * "field never rendered" apart from "field has the wrong value".
   * @param {string} fieldKey - One of the keys in REQUEST_FIELD_SELECTORS
   * @returns {import('@playwright/test').Locator}
   */
  getRequestFieldLocator(fieldKey) {
    return this.page.locator(this._requestFieldSelector(fieldKey)).first();
  }

  /**
   * Reads a request-assistance field value after scrolling it into view (the hotel item sits below
   * the fold). Best-effort: the DSL polls this, so a not-yet-rendered field or a value still settling
   * (e.g. the parallel hotel destination inherited reactively from the flight) returns "" here and
   * the poll retries rather than failing on the first read.
   * @param {string} fieldKey - One of the keys in REQUEST_FIELD_SELECTORS
   * @returns {Promise<string>}
   */
  async getRequestFieldValue(fieldKey) {
    const field = this.getRequestFieldLocator(fieldKey);
    await field.scrollIntoViewIfNeeded().catch(() => {});
    return (await field.inputValue().catch(() => "")).trim();
  }

  /**
   * Reads the cabin-class value shown in the request-assistance flight item. Unlike the origin/date
   * inputs this is an el-select whose selected label lives in .el-select__selection (not an input
   * value), so it's read via innerText. Best-effort: returns "" if not yet rendered so the DSL poll
   * can retry.
   * @returns {Promise<string>}
   */
  async getRequestFlightCabinClass() {
    const field = this.page.locator(SELECTORS.FLIGHT_CABIN_CLASS).first();
    await field.scrollIntoViewIfNeeded().catch(() => {});
    return (await field.innerText().catch(() => "")).trim();
  }

  /**
   * Counts the named (non-empty) travellers shown in the request-assistance travellers section.
   * Waits for at least one named traveller tag so the count isn't read before the list renders.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<number>}
   */
  async getTravelersCount({ timeout = 15000 } = {}) {
    const namedTravelers = this.page.locator(SELECTORS.TRAVELER_TAG_NAMED);
    try {
      await namedTravelers.first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[TravelRequestPage.getTravelersCount] No named travellers rendered in the request-assistance ` +
        `travellers section (selector: ${SELECTORS.TRAVELER_TAG_NAMED}) within ${timeout}ms. The travellers ` +
        `list may not have loaded. Original: ${err.message}`
      );
    }
    return namedTravelers.count();
  }

  // ===== "Add more services" =====

  /**
   * Clicks an "Add more services" product button (e.g. "Car", "Rail") to append that product's
   * request-assistance item. Same .product-btn control the Flight button uses.
   * @param {string} label - Product label the button must contain (e.g. "Car", "Rail")
   */
  async clickAddServiceButton(label) {
    if (!label || typeof label !== "string") {
      throw new Error(`label must be a non-empty string, got: ${typeof label}`);
    }
    await this.page
      .locator(SELECTORS.FLIGHT_SERVICE_BUTTON)
      .filter({ hasText: label })
      .first()
      .click({ timeout: 15000 });
  }

  /**
   * Waits for a product's search-inputs form to be visible after adding the item.
   * @param {"hotel"|"car"|"rail"} product
   */
  async waitForProductSearchInputs(product) {
    const cssClass = PRODUCT_SEARCH_INPUTS_CLASS[product];
    if (!cssClass) {
      throw new Error(`Unknown product "${product}". Known: ${Object.keys(PRODUCT_SEARCH_INPUTS_CLASS).join(", ")}.`);
    }
    await this.page.locator(`.${cssClass}`).first().waitFor({ state: "visible", timeout: 15000 });
  }

  // ===== Per-item comment =====

  /**
   * Gets the comment textarea for a given request-assistance item, scoped to that product's
   * search-inputs container so hotel/car/rail comments never cross-target.
   * @param {"hotel"|"car"|"rail"} product
   * @returns {import('@playwright/test').Locator}
   */
  getItemCommentTextarea(product) {
    const cssClass = PRODUCT_SEARCH_INPUTS_CLASS[product];
    if (!cssClass) {
      throw new Error(`Unknown product "${product}". Known: ${Object.keys(PRODUCT_SEARCH_INPUTS_CLASS).join(", ")}.`);
    }
    return this.page
      .locator(`.search-inputs-container:has(.${cssClass})`)
      .locator(SELECTORS.ITEM_COMMENT_TEXTAREA)
      .first();
  }

  /**
   * Fills the comment textarea of a request-assistance item.
   * @param {"hotel"|"car"|"rail"} product
   * @param {string} comment
   */
  async fillItemComment(product, comment) {
    const box = this.getItemCommentTextarea(product);
    await box.scrollIntoViewIfNeeded().catch(() => {});
    await box.waitFor({ state: "visible", timeout: 10000 });
    await box.fill(comment);
  }

  // ===== Autocomplete (internal building block) =====

  /**
   * Fills an autocomplete input and selects its first suggestion, then waits for the suggestion
   * popper to close. Scopes to the VISIBLE popper so a hidden, stale popper left by a previous
   * field (e.g. rail origin's popper while filling the destination) is never matched.
   * @param {string} inputSelector - CSS for the autocomplete input
   * @param {string} value - Text to type
   * @param {string} popperSelector - CSS for the suggestion popper (e.g. AUTOCOMPLETE_POPPER)
   */
  async fillAutocompleteAndSelectFirst(inputSelector, value, popperSelector) {
    const input = this.page.locator(inputSelector).first();
    await input.waitFor({ state: "visible", timeout: 15000 });
    await input.click();
    await input.fill(value);

    const visiblePopper = `${popperSelector}:visible`;
    const firstResult = this.page.locator(`${visiblePopper} ${SELECTORS.AUTOCOMPLETE_RESULT_ITEM}`).first();
    await firstResult.waitFor({ state: "visible", timeout: 15000 });
    await firstResult.click();
    // Wait for the popper to close (selection committed) before the next field is touched, rather
    // than a fixed sleep.
    await this.page.locator(visiblePopper).first().waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  }

  // ===== Car location + date pickers =====

  /** Fills the car pick-up location autocomplete and selects the first suggestion. */
  async fillCarPickUpLocation(value) {
    await this.fillAutocompleteAndSelectFirst(
      SELECTORS.CAR_PICKUP_LOCATION_INPUT,
      value,
      SELECTORS.AUTOCOMPLETE_POPPER
    );
  }

  /** Opens the car pick-up date picker. */
  async openCarPickUpDatePicker() {
    await this._openDatePicker(SELECTORS.CAR_PICKUP_DATE_INPUT);
  }

  /** Opens the car drop-off date picker. */
  async openCarDropOffDatePicker() {
    await this._openDatePicker(SELECTORS.CAR_DROPOFF_DATE_INPUT);
  }

  // ===== Rail stations + date pickers =====

  /** Fills the rail origin-station autocomplete and selects the first suggestion. */
  async fillRailOrigin(value) {
    await this.fillAutocompleteAndSelectFirst(
      SELECTORS.RAIL_ORIGIN_INPUT,
      value,
      SELECTORS.RAIL_AUTOCOMPLETE_POPPER
    );
  }

  /** Fills the rail destination-station autocomplete and selects the first suggestion. */
  async fillRailDestination(value) {
    await this.fillAutocompleteAndSelectFirst(
      SELECTORS.RAIL_DESTINATION_INPUT,
      value,
      SELECTORS.RAIL_AUTOCOMPLETE_POPPER
    );
  }

  /** Opens the rail departure date picker. */
  async openRailDepartureDatePicker() {
    await this._openDatePicker(SELECTORS.RAIL_DEPARTURE_DATE_INPUT);
  }

  /** Opens the rail return date picker. */
  async openRailReturnDatePicker() {
    await this._openDatePicker(SELECTORS.RAIL_RETURN_DATE_INPUT);
  }

  /**
   * Opens a date picker by clicking its input and waiting for the visible panel. Internal helper:
   * a hidden, stale range-picker from the earlier hotel search can linger in the DOM, so it scopes
   * to `.el-picker-panel:visible` rather than an unscoped first-match.
   * @param {string} inputSelector
   */
  async _openDatePicker(inputSelector) {
    const field = this.page.locator(inputSelector).first();
    await field.scrollIntoViewIfNeeded().catch(() => {});
    await field.waitFor({ state: "visible", timeout: 10000 });
    await field.click();
    await this.page.locator(".el-picker-panel:visible").first().waitFor({ state: "visible", timeout: 10000 });
    // Brief settle for Popper.js to finish repositioning the floating panel before day cells are
    // clicked (mirrors SearchPage.clickDepartureDateField).
    await this.page.waitForTimeout(400);
  }

  // ===== Requested-item comment (trip Requests tab) =====

  /**
   * Gets the requested-item comment paragraph filtered by its text. Comments are unique per product
   * in this flow, so matching by text reliably targets the right item's comment.
   * @param {string} text - The exact comment text to match
   * @returns {import('@playwright/test').Locator}
   */
  getRequestedItemComment(text) {
    if (!text || typeof text !== "string") {
      throw new Error(`text must be a non-empty string, got: ${typeof text}`);
    }
    return this.page.locator(SELECTORS.REQUESTED_ITEM_COMMENT).filter({ hasText: text });
  }
}

module.exports = { TravelRequestPage, SELECTORS };
