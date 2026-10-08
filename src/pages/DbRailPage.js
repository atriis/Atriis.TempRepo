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

  // Warning dialog db-rail-search-inputs.vue appends to <body>. It serves TWO cases: the
  // punch-out rejection (search() got canProceedToPunchOut=false — e.g. "Error while trying to
  // process payment card for Deutsche Bahn booking") and the post-"Go to trip" no-order-found
  // message (`showNoQuoteMessage`). Which one it is depends on the stage the flow was in when it
  // appeared. Closed Element Plus dialogs linger in the DOM, hence ':visible'.
  DB_RAIL_MESSAGE_DIALOG: '.app-dialog.db-rail-dialog-message:visible',
  // The message body is rendered with v-html (the locale string contains a <br/>), so its
  // textContent has no separator between the two sentences.
  DB_RAIL_MESSAGE_DIALOG_TEXT: '.app-dialog.db-rail-dialog-message:visible .message-text p',
  // The dialog's footer Close button (app-btn → native <button>).
  DB_RAIL_MESSAGE_DIALOG_CLOSE_BUTTON: '.app-dialog.db-rail-dialog-message:visible button:has-text("Close")',

  // The same form mounted by trip-index.vue in the new-trip search page's Rail tab (pane-rails).
  // Its buttons live in the page's shared trip-search-control, not in the form: stage one labels
  // the search button `btn.continue`; once the punch-out returns a Deutsche Bahn URL
  // (DBRailSecondStage) it is relabelled "New booking" and a second button, "Go to cart", is added.
  DB_RAIL_SEARCH_FORM: '.trip-index #pane-rails .db-rail-search-inputs',
  DB_RAIL_SEARCH_CONTINUE_BUTTON: '.trip-index .trip-search-control button.search-btn:has-text("Continue")',
  DB_RAIL_SEARCH_GO_TO_CART_BUTTON: '.trip-index .trip-search-control button.search-btn:has-text("Go to cart")',
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
   * Waits for the punch-out to resolve either way: the drawer reaching its second stage
   * ("Go to trip" rendered) or the warning dialog reporting that the backend refused the
   * punch-out (canProceedToPunchOut=false — e.g. a payment-card processing error).
   *
   * Returns `{ punchOutError: null }` when the second stage was reached, or
   * `{ punchOutError: '<backend message>' }` when the punch-out was rejected — so the caller can
   * fail fast with the real cause instead of timing out on a button that will never render.
   *
   * @param {number} [timeout=60000]
   * @returns {Promise<{punchOutError: string|null}>}
   */
  async waitForSecondStageOrPunchOutError({ timeout = 60000 } = {}) {
    return this.waitForPunchOutOutcome(
      SELECTORS.DB_RAIL_DRAWER_GO_TO_TRIP_BUTTON,
      'Go to trip',
      'waitForSecondStageOrPunchOutError',
      timeout
    );
  }

  /**
   * Search-page counterpart of waitForSecondStageOrPunchOutError: the second stage there is
   * signalled by the "Go to cart" button.
   *
   * @param {number} [timeout=60000]
   * @returns {Promise<{punchOutError: string|null}>}
   */
  async waitForSearchSecondStageOrPunchOutError({ timeout = 60000 } = {}) {
    return this.waitForPunchOutOutcome(
      SELECTORS.DB_RAIL_SEARCH_GO_TO_CART_BUTTON,
      'Go to cart',
      'waitForSearchSecondStageOrPunchOutError',
      timeout
    );
  }

  /**
   * Shared wait behind both punch-out surfaces: resolves on the second-stage button or on the
   * rejection dialog, whichever renders first.
   *
   * @param {string} secondStageSelector
   * @param {string} secondStageLabel - for the error message
   * @param {string} caller - for the error message
   * @param {number} timeout
   * @returns {Promise<{punchOutError: string|null}>}
   */
  async waitForPunchOutOutcome(secondStageSelector, secondStageLabel, caller, timeout) {
    const secondStage = this.page.locator(secondStageSelector).first();
    const errorDialog = this.page.locator(SELECTORS.DB_RAIL_MESSAGE_DIALOG).first();
    // Comma union: resolves as soon as EITHER outcome renders.
    const outcome = this.page
      .locator(`${secondStageSelector}, ${SELECTORS.DB_RAIL_MESSAGE_DIALOG}`)
      .first();

    try {
      await outcome.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.${caller}] The Deutsche Bahn punch-out did not ` +
        `resolve within ${timeout}ms — neither the second-stage "${secondStageLabel}" button ` +
        `(${secondStageSelector}) nor the rejection warning dialog ` +
        `(${SELECTORS.DB_RAIL_MESSAGE_DIALOG}) appeared. Likely cause: the /DBRail punch-out call ` +
        `never answered (DB service down or network stall). Original: ${err.message}`
      );
    }

    // A visible dialog at THIS stage can only be the punch-out rejection: the no-order-found
    // dialog only appears after the second-stage button is clicked.
    if (await errorDialog.isVisible().catch(() => false)) {
      const text = await this.getMessageDialogText({ timeout: 5000 }).catch(() => '');
      return { punchOutError: text || '(the warning dialog rendered no message text)' };
    }

    await secondStage.waitFor({ state: 'visible', timeout: 5000 });
    return { punchOutError: null };
  }

  /**
   * Waits for the DB Rail form in the new-trip search page's Rail tab.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<void>}
   */
  async waitForSearchForm({ timeout = 15000 } = {}) {
    try {
      await this.page.locator(SELECTORS.DB_RAIL_SEARCH_FORM).waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.waitForSearchForm] The Deutsche Bahn form did not render in the search page's ` +
        `Rail tab (${SELECTORS.DB_RAIL_SEARCH_FORM}) within ${timeout}ms. Likely causes: DB Rail was ` +
        `not picked in the Rail dropdown, or the trip is a pre-trip request (the Rail tab is hidden). ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the search page's stage-one "Continue" button, which starts the Deutsche Bahn punch-out.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<void>}
   */
  async clickSearchContinue({ timeout = 15000 } = {}) {
    const button = this.page.locator(SELECTORS.DB_RAIL_SEARCH_CONTINUE_BUTTON).first();
    try {
      await button.click({ timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.clickSearchContinue] Could not click the Deutsche Bahn "Continue" button on the ` +
        `search page (${SELECTORS.DB_RAIL_SEARCH_CONTINUE_BUTTON}) within ${timeout}ms. Likely ` +
        `causes: no eligible traveller was added, an overlay (e.g. a document expiry warning) covers ` +
        `the button, or the flow is already past stage one. Original: ${err.message}`
      );
    }
  }

  /**
   * Closes the DB Rail warning dialog via its footer Close button and waits for it to leave the
   * screen, so a follow-up "Continue" click cannot be intercepted by the dialog overlay.
   *
   * @param {number} [timeout=10000]
   * @returns {Promise<void>}
   */
  async closeMessageDialog({ timeout = 10000 } = {}) {
    const dialog = this.page.locator(SELECTORS.DB_RAIL_MESSAGE_DIALOG).first();
    const closeButton = this.page.locator(SELECTORS.DB_RAIL_MESSAGE_DIALOG_CLOSE_BUTTON).first();
    try {
      await closeButton.click({ timeout });
      await dialog.waitFor({ state: 'hidden', timeout });
    } catch (err) {
      throw new Error(
        `[DbRailPage.closeMessageDialog] Could not close the Deutsche Bahn warning dialog ` +
        `(${SELECTORS.DB_RAIL_MESSAGE_DIALOG_CLOSE_BUTTON}) within ${timeout}ms. Original: ${err.message}`
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
