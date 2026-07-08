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
}

module.exports = { TravelRequestPage, SELECTORS };
