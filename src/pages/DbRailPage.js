/**
 * Page Object for the Deutsche Bahn (DB Rail) booking flow rendered inside the trip
 * edit-search drawer (trip-app.vue `.atrs-edit-search-drawer` →
 * trip-edit-search.vue → db-rail-search-inputs.vue).
 *
 * DB Rail has no search form of its own: the drawer only shows an information message and a
 * two-stage button pair that punches out to the Deutsche Bahn site and then retrieves the
 * resulting order. Contains only UI-level interactions — the expected message texts and the
 * assertions live in the DbRail DSL.
 */

const SELECTORS = {
  // db-rail-search-inputs.vue root, scoped to the drawer so it can never resolve to the copy
  // trip-index.vue mounts in the Rail product tab (that one renders `openNewTabMsg` instead of
  // `newSearchMsg`, because it passes isEditSearch=false).
  DB_RAIL_DRAWER_FORM: '.atrs-edit-search-drawer .db-rail-search-inputs',
  // The <app-msg> below the eligibility copy. app-msg.vue renders its `text` prop into
  // `p.app-msg-text`; in the drawer (isEditSearch=true) that text is `DBrail.newSearchMsg`.
  DB_RAIL_DRAWER_INFO_MESSAGE: '.atrs-edit-search-drawer .db-rail-search-inputs .app-msg p.app-msg-text',

  // Both drawer buttons are app-btn instances carrying class `search-btn`
  // (trip-search-control.vue), so they can only be told apart by their label. In stage one only
  // the search button exists and trip-edit-search.vue labels it `btn.continue`; reaching stage two
  // (isDbRailSecondStage) relabels it `DBrail.newBooking` and renders the add-to-cart button
  // labelled `btn.goToTrip` next to it. The "Go to trip" button therefore doubles as the
  // stage-two signal.
  DB_RAIL_DRAWER_CONTINUE_BUTTON: '.atrs-edit-search-drawer button.search-btn:has-text("Continue")',
  DB_RAIL_DRAWER_GO_TO_TRIP_BUTTON: '.atrs-edit-search-drawer button.search-btn:has-text("Go to trip")',

  // Warning dialog db-rail-search-inputs.vue appends to <body> when no finalised DB order can be
  // found (`showNoQuoteMessage`). Closed Element Plus dialogs linger in the DOM, hence ':visible'.
  DB_RAIL_MESSAGE_DIALOG: '.app-dialog.db-rail-dialog-message:visible',
  // The message body is rendered with v-html (the locale string contains a <br/>), so its
  // textContent has no separator between the two sentences.
  DB_RAIL_MESSAGE_DIALOG_TEXT: '.app-dialog.db-rail-dialog-message:visible .message-text p',
};

/**
 * DB Rail drawer page object.
 * It does NOT contain business logic — business flows live in the DbRail DSL.
 */
class DbRailPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Waits for the DB Rail form to be rendered inside the edit-search drawer. The component is
   * lazily imported (defineAsyncComponent in trip-edit-search.vue), so the drawer can be visible
   * for a moment before the form itself exists.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<void>}
   */
  async waitForDrawerForm({ timeout = 15000 } = {}) {
    try {
      await this.page.locator(SELECTORS.DB_RAIL_DRAWER_FORM).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.waitForDrawerForm] The Deutsche Bahn form did not render in the edit-search ` +
        `drawer (${SELECTORS.DB_RAIL_DRAWER_FORM}) within ${timeout}ms. Likely causes: the drawer ` +
        `was opened for a different product, or the lazily loaded db-rail-search-inputs chunk ` +
        `failed to load. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the information message shown in the DB Rail drawer.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<string>} The message text, whitespace-normalised
   */
  async getInfoMessageText({ timeout = 15000 } = {}) {
    const message = this.page.locator(SELECTORS.DB_RAIL_DRAWER_INFO_MESSAGE).first();
    try {
      await message.waitFor({ state: 'visible', timeout });
      const text = await message.textContent();
      return (text || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[DbRailPage.getInfoMessageText] Could not read the Deutsche Bahn information message in the ` +
        `edit-search drawer (${SELECTORS.DB_RAIL_DRAWER_INFO_MESSAGE}) within ${timeout}ms. Likely ` +
        `causes: the drawer is not open, or the DB form rendered its second-stage copy instead of ` +
        `the pre-punch-out message. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the drawer's stage-one "Continue" button, which punches out to the Deutsche Bahn site.
   *
   * db-rail-search-inputs.ts `search()` calls window.open BEFORE it knows whether the punch-out
   * will succeed, so a popup tab is always created. The caller must capture it — this method only
   * clicks.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<void>}
   */
  async clickContinue({ timeout = 15000 } = {}) {
    const button = this.page.locator(SELECTORS.DB_RAIL_DRAWER_CONTINUE_BUTTON).first();
    try {
      await button.waitFor({ state: 'visible', timeout });
      await button.click({ timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.clickContinue] Could not click the Deutsche Bahn "Continue" button in the ` +
        `edit-search drawer (${SELECTORS.DB_RAIL_DRAWER_CONTINUE_BUTTON}) within ${timeout}ms. ` +
        `Likely causes: the drawer is not open on the DB form, the flow is already past stage one ` +
        `(the button is relabelled "New booking" once punch-out succeeded), or online search is ` +
        `disabled for this user. Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the drawer's stage-two "Go to trip" button, which only renders once the punch-out
   * returned a Deutsche Bahn URL (isDbRailSecondStage).
   *
   * @param {number} [timeout=60000]
   * @returns {Promise<void>}
   */
  async waitForGoToTripButton({ timeout = 60000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.DB_RAIL_DRAWER_GO_TO_TRIP_BUTTON)
        .first()
        .waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.waitForGoToTripButton] The Deutsche Bahn drawer never reached its second stage ` +
        `— "Go to trip" (${SELECTORS.DB_RAIL_DRAWER_GO_TO_TRIP_BUTTON}) was not visible within ` +
        `${timeout}ms. Likely causes: the punch-out call returned canProceedToPunchOut=false (the ` +
        `drawer then shows a warning dialog instead), the traveller is not eligible to book ` +
        `Deutsche Bahn, or the DB service did not respond. Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the drawer's stage-two "Go to trip" button, which asks the backend to retrieve the
   * Deutsche Bahn order.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<void>}
   */
  async clickGoToTrip({ timeout = 15000 } = {}) {
    const button = this.page.locator(SELECTORS.DB_RAIL_DRAWER_GO_TO_TRIP_BUTTON).first();
    try {
      await button.click({ timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.clickGoToTrip] Could not click the Deutsche Bahn "Go to trip" button in the ` +
        `edit-search drawer (${SELECTORS.DB_RAIL_DRAWER_GO_TO_TRIP_BUTTON}) within ${timeout}ms. ` +
        `Likely causes: the button is still in its loading state from a previous click, or the ` +
        `drawer closed. Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the text of the DB Rail warning dialog (showNoQuoteMessage).
   *
   * @param {number} [timeout=60000]
   * @returns {Promise<string>} The dialog body text, whitespace-normalised
   */
  async getMessageDialogText({ timeout = 60000 } = {}) {
    const body = this.page.locator(SELECTORS.DB_RAIL_MESSAGE_DIALOG_TEXT).first();
    try {
      await this.page
        .locator(SELECTORS.DB_RAIL_MESSAGE_DIALOG)
        .first()
        .waitFor({ state: 'visible', timeout });
      await body.waitFor({ state: 'visible', timeout });
      const text = await body.textContent();
      return (text || '').replace(/\s+/g, ' ').trim();
    } catch (err) {
      throw new Error(
        `[DbRailPage.getMessageDialogText] The Deutsche Bahn warning dialog ` +
        `(${SELECTORS.DB_RAIL_MESSAGE_DIALOG}) did not appear within ${timeout}ms, so its message ` +
        `could not be read. Likely causes: the order retrieval succeeded and the app routed to the ` +
        `cart instead, or the "Go to trip" click never reached the backend. Original: ${err.message}`
      );
    }
  }
}

module.exports = {
  DbRailPage,
  SELECTORS,
};
