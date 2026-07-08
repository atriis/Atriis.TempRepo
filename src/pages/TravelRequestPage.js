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

  // Hotel item — the hotel-search-inputs component renders inside the hotel request item.
  // Destination is a hotel-autocomplete input (value = destination Name); check-in/check-out are
  // the app-daterange el-range-inputs carrying the hotel.checkIn / hotel.checkOut placeholders.
  HOTEL_DESTINATION_INPUT: ".request-assistance-main .hotel-search-inputs .hotel-autocomplete-wrapper input",
  HOTEL_CHECK_IN_INPUT: ".request-assistance-main .hotel-search-inputs [placeholder='Check in']",
  HOTEL_CHECK_OUT_INPUT: ".request-assistance-main .hotel-search-inputs [placeholder='Check out']",
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
    await this.page
      .locator(SELECTORS.FLIGHT_SERVICE_BUTTON)
      .filter({ hasText: 'Flight' })
      .click();
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
}

module.exports = { TravelRequestPage, SELECTORS };
