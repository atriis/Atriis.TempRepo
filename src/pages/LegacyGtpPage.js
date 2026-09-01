/**
 * Page Object for the legacy GTP front (AngularJS) used by AGENTS to work requested trips.
 * Contains only UI-level interactions.
 *
 * This is a different application from the OBT (Vue) front: no data-testids exist, so locators
 * anchor on the AngularJS directive attributes (ng-click / data-ng-click), which name the
 * controller handlers and are stable across releases. Selector source: the Testim export of
 * test 33776 (tests/testim/.../shell/copy_trip/33776_...js, agent section).
 */

const SELECTORS = {
  // ===== Login (legacy GTP landing) =====
  USERNAME_INPUT: "#username",
  PASSWORD_INPUT: "#Password",
  LOGIN_SUBMIT: ".loginButtonSubmit",
  // Sign-out control shown when a previous session is still active on the landing page.
  SIGN_OUT_BUTTON: ".SignOut",
  // "Welcome on Board!" heading of the agent's my-bookings landing view — the post-login signal.
  WELCOME_LANDING: '[ng-show="mybookingsViewMode==MybookingsViewMode.Landing"] > :nth-child(2)',

  // ===== Requested-trip view: per-product "Search Online" re-search links =====
  FLIGHT_RESEARCH_LINK: '[ng-click*="onFlightReSearchClicked"]',
  CAR_RESEARCH_LINK: '[ng-click*="onCarReSearchClicked"]',
  HOTEL_RESEARCH_LINK: '[ng-click*="onHotelReSearchClicked"]',

  // ===== Flight re-search form + results =====
  FLIGHT_FROM_INPUT: "#from0",
  // jQuery-UI autocomplete suggestion rows. Never target #ui-id-N — those ids are per-pageload.
  JQUERY_AUTOCOMPLETE_OPTION: "ul.ui-autocomplete li.ui-menu-item",
  FLIGHT_SEARCH_BUTTON: '[ng-disabled="showLoadingSearch || IsDisableFlightSearch"]',
  // "Price" column header of the flight results table — the results-ready signal.
  FLIGHT_RESULTS_PRICE_HEADER: "#priceTd",
  FLIGHT_ADD_TO_CART_ICON: "#button-flight0 .trip-cart-icon-new",

  // ===== Car re-search + results =====
  CAR_SEARCH_BUTTON: '[data-ng-click="onSearchCarsClicked()"]',
  // "Rental Agency" sortable column header — the car-results-ready signal.
  CAR_RESULTS_AGENCY_HEADER: '[data-ng-click="onSortHeaderClicked(rentalAgencySort)"]',
  CAR_ADD_TO_CART_ICON: "#carItem0 .trip-cart-icon-new",

  // ===== Hotel re-search + results =====
  HOTEL_SEARCH_BUTTON: '[data-ng-click="onSearchHotelsClicked()"]',
  // "Sort by:" bar of the hotel results list — the hotel-results-ready signal.
  HOTEL_RESULTS_SORT_BAR: ".filter-sort-by",
  // First hotel row's price-offer block — clicking it expands the hotel's rooms.
  FIRST_HOTEL_PRICE_OFFER: '#hotelItem0 [ng-switch="isPriceOffer"]',
  HOTEL_ROOM_ADD_TO_CART_ICON: ".room-container .trip-cart-icon-new",

  // "Added" cart confirmation shown after an add-to-cart click (e.g. "Added" / "1 Added").
  // Scoped to the two containers that actually render it — the per-product booking-state block
  // (cars, hotels) and the flight package block. A bare `.ng-binding` match would also hit
  // unrelated bindings elsewhere on the legacy page, so a stale "Added" from the PREVIOUS
  // product could satisfy the wait instantly and let the next step race ahead.
  ADDED_INDICATOR:
    '[ng-hide="bookingInProgress || bookingSucceeded || bookingFailed"] .ng-binding, ' +
    '[ng-class="{altertnativePackage:packageModel.IsAlternativePackageWasSelected}"]',
  // ===== "Conflicting Quote Warning" modal =====
  // The legacy front raises this jQuery-UI modal when the product being added duplicates a quote
  // held by ANOTHER trip for the same traveller — which is exactly what a re-run of this test
  // produces, since the previous run's trip still holds the same flight/car/hotel. It is modal:
  // its .ui-widget-overlay backdrop swallows every click until the dialog is answered.
  // Scoped by title because the page also keeps other dialogs (e.g. "Out of Policy Alert") in the
  // DOM with display:none, and :visible is required so a hidden one never matches.
  CONFLICT_DIALOG:
    '.ui-dialog:visible:has(.ui-dialog-title:text-is("Conflicting Quote Warning"))',
  // "Add to cart" answers the warning and completes the add; "Remove selection" abandons it.
  CONFLICT_DIALOG_CONFIRM_BUTTON: '.ui-dialog-buttonset button',
  // Any jQuery-UI modal backdrop. Present only while a modal dialog is open.
  JQUERY_MODAL_OVERLAY: ".ui-widget-overlay",
  // Title of any currently open jQuery-UI dialog — used to explain a stuck backdrop.
  JQUERY_DIALOG_TITLE: ".ui-dialog:visible .ui-dialog-title",
  // Closes the re-search overlay and returns to the requested-trip view.
  BACK_TO_TRIP_BUTTON: "#ss",
};

class LegacyGtpPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ===== Login =====

  /** The login submit button locator (also the "login form is shown" probe). */
  getLoginSubmitButton() {
    return this.page.locator(SELECTORS.LOGIN_SUBMIT).first();
  }

  /** The landing-page sign-out control locator (present when a session is still active). */
  getSignOutButton() {
    return this.page.locator(SELECTORS.SIGN_OUT_BUTTON).first();
  }

  /** Clicks the sign-out control on the landing page. */
  async clickSignOut() {
    try {
      await this.getSignOutButton().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickSignOut] Could not click the legacy GTP sign-out control ` +
        `(${SELECTORS.SIGN_OUT_BUTTON}). A previous session was detected but its sign-out ` +
        `control was not clickable. Original: ${err.message}`
      );
    }
  }

  /** Fills the agent username on the legacy GTP login form. */
  async fillUsername(username) {
    if (!username || typeof username !== "string") {
      throw new Error(`"username" must be a non-empty string, got: ${typeof username}`);
    }
    try {
      const input = this.page.locator(SELECTORS.USERNAME_INPUT).first();
      await input.waitFor({ state: "visible", timeout: 15000 });
      await input.fill(username);
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.fillUsername] Could not fill the legacy GTP username field ` +
        `(${SELECTORS.USERNAME_INPUT}). The login form may not have rendered. Original: ${err.message}`
      );
    }
  }

  /** Fills the agent password on the legacy GTP login form. */
  async fillPassword(password) {
    if (!password || typeof password !== "string") {
      throw new Error(`"password" must be a non-empty string, got: ${typeof password}`);
    }
    try {
      const input = this.page.locator(SELECTORS.PASSWORD_INPUT).first();
      await input.waitFor({ state: "visible", timeout: 15000 });
      await input.fill(password);
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.fillPassword] Could not fill the legacy GTP password field ` +
        `(${SELECTORS.PASSWORD_INPUT}). The login form may not have rendered. Original: ${err.message}`
      );
    }
  }

  /** Clicks the legacy GTP login submit button. */
  async clickLoginSubmit() {
    try {
      await this.getLoginSubmitButton().click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickLoginSubmit] Could not click the legacy GTP login button ` +
        `(${SELECTORS.LOGIN_SUBMIT}). Original: ${err.message}`
      );
    }
  }

  /** Waits for the agent's "Welcome on Board!" landing view — the post-login ready signal. */
  async waitForWelcomeLanding({ timeout = 30000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.WELCOME_LANDING)
        .first()
        .waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForWelcomeLanding] The legacy GTP landing view (${SELECTORS.WELCOME_LANDING}) ` +
        `did not appear within ${timeout}ms after login. The credentials may be wrong or the legacy ` +
        `front may be unreachable. Original: ${err.message}`
      );
    }
  }

  // ===== Requested-trip view: re-search links =====

  /**
   * Clicks a product's "Search Online" re-search link on the requested trip.
   * @param {"flight"|"car"|"hotel"} product
   */
  async clickReSearchLink(product) {
    const linkSelector = {
      flight: SELECTORS.FLIGHT_RESEARCH_LINK,
      car: SELECTORS.CAR_RESEARCH_LINK,
      hotel: SELECTORS.HOTEL_RESEARCH_LINK,
    }[product];
    if (!linkSelector) {
      throw new Error(`"product" must be one of flight|car|hotel, got: ${JSON.stringify(product)}`);
    }
    try {
      const link = this.page.locator(linkSelector).first();
      await link.waitFor({ state: "visible", timeout: 30000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickReSearchLink] Could not click the ${product} "Search Online" re-search ` +
        `link (${linkSelector}) on the requested trip. The trip may not contain a requested ${product} ` +
        `item, or the trip view did not finish loading. Original: ${err.message}`
      );
    }
  }

  // ===== Flight re-search =====

  /**
   * Types the flight origin into the legacy search form. Typed key-by-key (not fill) so the
   * jQuery-UI autocomplete fires and opens its suggestions.
   */
  async typeFlightOrigin(value) {
    if (!value || typeof value !== "string") {
      throw new Error(`"value" must be a non-empty string, got: ${typeof value}`);
    }
    try {
      const input = this.page.locator(SELECTORS.FLIGHT_FROM_INPUT).first();
      await input.waitFor({ state: "visible", timeout: 20000 });
      await input.click();
      await input.fill("");
      await input.pressSequentially(value, { delay: 100 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.typeFlightOrigin] Could not type "${value}" into the legacy flight origin ` +
        `field (${SELECTORS.FLIGHT_FROM_INPUT}). The re-search form may not have opened. Original: ${err.message}`
      );
    }
  }

  /** Clicks the first visible jQuery-UI autocomplete suggestion. */
  async selectFirstAutocompleteOption() {
    try {
      const option = this.page.locator(`${SELECTORS.JQUERY_AUTOCOMPLETE_OPTION}:visible`).first();
      await option.waitFor({ state: "visible", timeout: 15000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.selectFirstAutocompleteOption] No jQuery-UI autocomplete suggestion ` +
        `(${SELECTORS.JQUERY_AUTOCOMPLETE_OPTION}) became visible. The typed query may have no ` +
        `matches, or typing did not trigger the autocomplete. Original: ${err.message}`
      );
    }
  }

  /** Clicks the flight Search button on the legacy re-search form. */
  async clickFlightSearchButton() {
    try {
      const button = this.page.locator(SELECTORS.FLIGHT_SEARCH_BUTTON).first();
      await button.waitFor({ state: "visible", timeout: 20000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickFlightSearchButton] Could not click the legacy flight Search button ` +
        `(${SELECTORS.FLIGHT_SEARCH_BUTTON}). Original: ${err.message}`
      );
    }
  }

  /** Waits for the legacy flight results table (its "Price" column header). */
  async waitForFlightResults({ timeout = 120000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.FLIGHT_RESULTS_PRICE_HEADER)
        .first()
        .waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForFlightResults] Legacy flight results (${SELECTORS.FLIGHT_RESULTS_PRICE_HEADER}) ` +
        `did not appear within ${timeout}ms. The GDS search may have failed or returned nothing for ` +
        `the requested route. Original: ${err.message}`
      );
    }
  }

  /** Clicks the add-to-cart icon on the first flight result. */
  async clickAddFirstFlightToCart() {
    try {
      const icon = this.page.locator(SELECTORS.FLIGHT_ADD_TO_CART_ICON).first();
      await icon.waitFor({ state: "visible", timeout: 20000 });
      await icon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickAddFirstFlightToCart] Could not click the first flight result's ` +
        `add-to-cart icon (${SELECTORS.FLIGHT_ADD_TO_CART_ICON}). The results list may be empty. ` +
        `Original: ${err.message}`
      );
    }
  }

  // ===== Car re-search =====

  /** Clicks the car Search button on the legacy re-search form. */
  async clickCarSearchButton() {
    try {
      const button = this.page.locator(SELECTORS.CAR_SEARCH_BUTTON).first();
      await button.waitFor({ state: "visible", timeout: 20000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickCarSearchButton] Could not click the legacy car Search button ` +
        `(${SELECTORS.CAR_SEARCH_BUTTON}). Original: ${err.message}`
      );
    }
  }

  /** Waits for the legacy car results table (its "Rental Agency" column header). */
  async waitForCarResults({ timeout = 120000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.CAR_RESULTS_AGENCY_HEADER)
        .first()
        .waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForCarResults] Legacy car results (${SELECTORS.CAR_RESULTS_AGENCY_HEADER}) ` +
        `did not appear within ${timeout}ms. The car search may have failed or returned nothing. ` +
        `Original: ${err.message}`
      );
    }
  }

  /** Clicks the add-to-cart icon on the first car result. */
  async clickAddFirstCarToCart() {
    try {
      const icon = this.page.locator(SELECTORS.CAR_ADD_TO_CART_ICON).first();
      await icon.waitFor({ state: "visible", timeout: 20000 });
      await icon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickAddFirstCarToCart] Could not click the first car result's add-to-cart ` +
        `icon (${SELECTORS.CAR_ADD_TO_CART_ICON}). The results list may be empty. Original: ${err.message}`
      );
    }
  }

  // ===== Hotel re-search =====

  /** Clicks the hotel Search button on the legacy re-search form. */
  async clickHotelSearchButton() {
    try {
      const button = this.page.locator(SELECTORS.HOTEL_SEARCH_BUTTON).first();
      await button.waitFor({ state: "visible", timeout: 20000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickHotelSearchButton] Could not click the legacy hotel Search button ` +
        `(${SELECTORS.HOTEL_SEARCH_BUTTON}). Original: ${err.message}`
      );
    }
  }

  /** Waits for the legacy hotel results list (its "Sort by:" bar). */
  async waitForHotelResults({ timeout = 120000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.HOTEL_RESULTS_SORT_BAR)
        .first()
        .waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForHotelResults] Legacy hotel results (${SELECTORS.HOTEL_RESULTS_SORT_BAR}) ` +
        `did not appear within ${timeout}ms. The hotel search may have failed or returned nothing. ` +
        `Original: ${err.message}`
      );
    }
  }

  /** Clicks the first hotel result's price offer to expand its rooms. */
  async clickFirstHotelPriceOffer() {
    try {
      const offer = this.page.locator(SELECTORS.FIRST_HOTEL_PRICE_OFFER).first();
      await offer.waitFor({ state: "visible", timeout: 20000 });
      await offer.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickFirstHotelPriceOffer] Could not click the first hotel result's price ` +
        `offer (${SELECTORS.FIRST_HOTEL_PRICE_OFFER}). The results list may be empty. Original: ${err.message}`
      );
    }
  }

  /** Clicks the add-to-cart icon on the first visible room of the expanded hotel. */
  async clickAddFirstRoomToCart() {
    try {
      const icon = this.page.locator(`${SELECTORS.HOTEL_ROOM_ADD_TO_CART_ICON}:visible`).first();
      await icon.waitFor({ state: "visible", timeout: 30000 });
      await icon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickAddFirstRoomToCart] Could not click the first room's add-to-cart icon ` +
        `(${SELECTORS.HOTEL_ROOM_ADD_TO_CART_ICON}). The hotel's rooms may not have expanded. ` +
        `Original: ${err.message}`
      );
    }
  }

  // ===== Shared post-add =====

  /** Waits for the "Added" cart confirmation binding (e.g. "1 Added") after an add-to-cart click. */
  async waitForAddedIndicator({ timeout = 60000 } = {}) {
    try {
      await this.page
        .locator(SELECTORS.ADDED_INDICATOR, { hasText: /\bAdded\b/ })
        .first()
        .waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForAddedIndicator] No "Added" confirmation (${SELECTORS.ADDED_INDICATOR} ` +
        `with text "Added") appeared within ${timeout}ms after the add-to-cart click. The add may have ` +
        `failed on the legacy front. Original: ${err.message}`
      );
    }
  }

  /**
   * Answers the "Conflicting Quote Warning" modal with "Add to cart" if the legacy front raised
   * one, completing the add. Safe to call when no dialog appears — that is the normal path on a
   * first run against a fresh traveller, so absence is resolved as "nothing to do", not an error.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=5000] - How long to give the dialog to appear.
   * @returns {Promise<boolean>} true if a conflict warning was answered.
   */
  async handleConflictingQuoteWarningIfVisible({ timeout = 5000 } = {}) {
    const dialog = this.page.locator(SELECTORS.CONFLICT_DIALOG).first();
    try {
      await dialog.waitFor({ state: "visible", timeout });
    } catch {
      return false;
    }
    try {
      const confirm = dialog
        .locator(SELECTORS.CONFLICT_DIALOG_CONFIRM_BUTTON)
        .filter({ hasText: /^\s*Add to cart\s*$/ })
        .first();
      await confirm.click({ timeout: 10000 });
      // The add only completes once the modal — and with it the click-blocking backdrop — is gone.
      await dialog.waitFor({ state: "hidden", timeout: 30000 });
      return true;
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.handleConflictingQuoteWarningIfVisible] The "Conflicting Quote Warning" ` +
        `modal was open but could not be confirmed with its "Add to cart" button. The add-to-cart ` +
        `is incomplete and the modal backdrop will block every later click. Original: ${err.message}`
      );
    }
  }

  /** Reads the titles of every jQuery-UI dialog currently open — diagnostics for a stuck backdrop. */
  async getOpenDialogTitles() {
    try {
      return await this.page.locator(SELECTORS.JQUERY_DIALOG_TITLE).allTextContents();
    } catch {
      return [];
    }
  }

  /** Clicks the button that closes the re-search overlay and returns to the requested-trip view. */
  async clickBackToTrip() {
    try {
      // The legacy front raises the conflicting-quote warning a few seconds AFTER the "Added"
      // binding updates, so by the time the flow reaches this click the modal — and its
      // click-swallowing backdrop — is up. Answer it here rather than at the add-to-cart click,
      // which is too early to see it. All three add flows funnel through this method.
      await this.handleConflictingQuoteWarningIfVisible();
      // #ss can be visible, enabled and stable while a modal backdrop still covers it, so a click
      // here would silently burn its whole retry budget on an intercepted target. Wait the
      // backdrop out first; if one is stuck, name the dialog holding it rather than failing blind.
      try {
        await this.page
          .locator(SELECTORS.JQUERY_MODAL_OVERLAY)
          .first()
          .waitFor({ state: "hidden", timeout: 30000 });
      } catch (overlayErr) {
        const titles = await this.getOpenDialogTitles();
        throw new Error(
          `a jQuery-UI modal backdrop (${SELECTORS.JQUERY_MODAL_OVERLAY}) never cleared, so the ` +
          `control was unclickable. Open dialog(s): ` +
          `${titles.length ? titles.map((t) => `"${t.trim()}"`).join(", ") : "none readable"}. ` +
          `Original: ${overlayErr.message}`
        );
      }
      const button = this.page.locator(SELECTORS.BACK_TO_TRIP_BUTTON).first();
      await button.waitFor({ state: "visible", timeout: 20000 });
      await button.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickBackToTrip] Could not click the back-to-trip control ` +
        `(${SELECTORS.BACK_TO_TRIP_BUTTON}) after adding to cart. Original: ${err.message}`
      );
    }
  }
}

module.exports = { LegacyGtpPage, SELECTORS };
