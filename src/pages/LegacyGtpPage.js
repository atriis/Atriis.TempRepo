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
  // Agent link into the agency's GTP Admin Center: /AgencyAdministration/<agencyId>#/Agency/<agencyId>/...
  AGENCY_ADMINISTRATION_LINK: 'a[href*="/AgencyAdministration/"]',

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
  // One row per hotel result, ids running #hotelItem0..N.
  HOTEL_RESULT_ITEM: '[id^="hotelItem"]',
  // A hotel row's price-offer block. Clicking it OPENS THAT HOTEL'S ROOMS VIEW (route
  // #/hotels/results -> rooms) — the results list is replaced, not expanded in place, so getting
  // back to the list requires BACK_TO_HOTEL_RESULTS_LINK.
  HOTEL_PRICE_OFFER: (index) => `#hotelItem${index} [ng-switch="isPriceOffer"]`,
  HOTEL_ROOM_ADD_TO_CART_ICON: ".room-container .trip-cart-icon-new",
  // Row-RELATIVE version of the same icon, for chaining inside one ROOM_ITEM locator. The page-wide
  // selector above cannot be chained: `.room-container` is the room row's ANCESTOR, so resolving it
  // relative to the row would look for a .room-container INSIDE .room-item and match nothing.
  ROOM_ROW_ADD_TO_CART_ICON: ".trip-cart-icon-new",
  // Rooms view — one `.room-item` per room (data-ng-repeat="room in rooms"), each holding exactly
  // one cancellation-policy span and one add-to-cart icon. Scoping by the row is what keeps "the
  // refundable room's cart icon" from degrading into "the first cart icon on the page".
  ROOM_ITEM: ".room-container .room-item",
  // A room's cancellation policy. The `title` attribute carries the FULL policy while the visible
  // text is truncated by the `truncate` filter, so the attribute is what to match: exactly
  // "Non Refundable" for a non-refundable rate, a real deadline ("Cancellation after 23:59,
  // Mon, 30 Nov 26 will be charged 1 night(s)") for a refundable one.
  ROOM_CANCELLATION_POLICY: '[data-ng-switch="room.CancellationPolicyTime"] span[title]',
  // A room row whose policy is anything OTHER than non-refundable. The `i` flag makes each match
  // case-insensitive ("NON REFUNDABLE" is still caught) and the chained :not()s cover the
  // spelling variants suppliers use: "non refundable", "non-refundable", "nonrefundable".
  // Requiring span[title] inside :has() means a room with an EMPTY CancellationPolicyTime (which
  // renders no policy span at all) is excluded too — an unknown policy must never be treated as
  // refundable. LegacyGtp.addRefundableHotelToTrip re-verifies the picked room's policy text as a
  // second line of defence.
  REFUNDABLE_ROOM_ITEM:
    '.room-container .room-item:has([data-ng-switch="room.CancellationPolicyTime"] ' +
    'span[title]:not([title*="non refundable" i]):not([title*="non-refundable" i])' +
    ':not([title*="nonrefundable" i]))',
  // "<< Back to hotel results" in the rooms-view header. Rendered twice (one copy hidden), so
  // :visible is required.
  BACK_TO_HOTEL_RESULTS_LINK: '.hotel-room-results-header a[href="#/hotels/results"]:visible',

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

  // ===== Trip cart — seat selection (post-booking) =====
  // A flight quote's "Seating (No Seats)" / "Seating (Pending)" / "Seating (Succeeded)" validation
  // tab. The label and its status are one text node in one element, so the innermost element whose
  // text starts with "Seating (" is the tab itself (one per flight quote, in cart order).
  SEATING_TAB:
    'xpath=//*[starts-with(normalize-space(.),"Seating (") and not(*[starts-with(normalize-space(.),"Seating (")])]',
  // The seat map is an <img> with an image map: one <area> per selectable seat, each bound
  // (ng-repeat "seatMetadata in selectedFlight.seatMapMetadata.Seats") to its seat's metadata.
  SEAT_MAP_AREA: 'map[name="seatmap"] area',
  // The popup's left-hand list of the quote's flights ("BRU → ATH", "ATH → BRU").
  SEAT_POPUP_FLIGHT_BUTTON: '[data-ng-click="onFlightClicked(flight)"]',
  // The popup's "Save" (onSaveClicked(false)); "Save and close" is a separate button.
  SEAT_POPUP_SAVE_BUTTON: 'button[data-ng-click="onSaveClicked(false)"]',
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

  // ===== Agency administration entry (test 43181) =====

  /**
   * Reads the href of the agent's agency-administration link on the landing page. It is the only
   * place the agent's own agency id is exposed, so the admin is entered through it rather than a
   * hard-coded id.
   *
   * @returns {Promise<string>} e.g. "/AgencyAdministration/275295#/Agency/275295/AgencySettings"
   */
  async getAgencyAdministrationHref({ timeout = 30000 } = {}) {
    const link = this.page.locator(SELECTORS.AGENCY_ADMINISTRATION_LINK).first();
    try {
      await link.waitFor({ state: "attached", timeout });
      const href = await link.getAttribute("href");
      if (!href) {
        throw new Error("the link has no href");
      }
      return href;
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.getAgencyAdministrationHref] The agency administration link ` +
        `(${SELECTORS.AGENCY_ADMINISTRATION_LINK}) is not on the legacy GTP landing page. The agent may ` +
        `lack administration rights. Original: ${err.message}`
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

  /** Counts the hotel result rows currently listed. */
  async getHotelResultCount() {
    try {
      return await this.page.locator(SELECTORS.HOTEL_RESULT_ITEM).count();
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.getHotelResultCount] Could not count the hotel result rows ` +
        `(${SELECTORS.HOTEL_RESULT_ITEM}). The results list may have been replaced mid-read. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Clicks the price offer of the hotel result at `index`, opening that hotel's rooms view.
   * @param {number} index - Zero-based hotel row index (#hotelItem{index}).
   */
  async clickHotelPriceOfferByIndex(index) {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`"index" must be a non-negative integer, got: ${JSON.stringify(index)}`);
    }
    const selector = SELECTORS.HOTEL_PRICE_OFFER(index);
    try {
      const offer = this.page.locator(selector).first();
      await offer.waitFor({ state: "visible", timeout: 20000 });
      await offer.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickHotelPriceOfferByIndex] Could not click hotel result ${index}'s price ` +
        `offer (${selector}). The results list may hold fewer than ${index + 1} hotels. ` +
        `Original: ${err.message}`
      );
    }
  }

  /** Clicks the first hotel result's price offer to open its rooms. */
  async clickFirstHotelPriceOffer() {
    await this.clickHotelPriceOfferByIndex(0);
  }

  /** Waits for the opened hotel's room list to render. */
  async waitForRoomList({ timeout = 60000 } = {}) {
    try {
      await this.page.locator(SELECTORS.ROOM_ITEM).first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForRoomList] No room rows (${SELECTORS.ROOM_ITEM}) appeared within ` +
        `${timeout}ms after opening the hotel. The hotel may offer no bookable rooms, or the rooms ` +
        `view did not load. Original: ${err.message}`
      );
    }
  }

  /** Counts the rooms of the opened hotel whose cancellation policy is NOT non-refundable. */
  async getRefundableRoomCount() {
    try {
      return await this.page.locator(SELECTORS.REFUNDABLE_ROOM_ITEM).count();
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.getRefundableRoomCount] Could not count the refundable rooms ` +
        `(${SELECTORS.REFUNDABLE_ROOM_ITEM}). Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the full cancellation policy of the first refundable room — the evidence of WHY that
   * room is about to be picked, re-verified by the DSL so a wrong pick fails loudly.
   * @returns {Promise<string>}
   */
  async getFirstRefundableRoomPolicy() {
    const policy = this.page
      .locator(SELECTORS.REFUNDABLE_ROOM_ITEM)
      .first()
      .locator(SELECTORS.ROOM_CANCELLATION_POLICY)
      .first();
    try {
      await policy.waitFor({ state: "visible", timeout: 20000 });
      return (await policy.getAttribute("title")) || "";
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.getFirstRefundableRoomPolicy] Could not read the cancellation policy of the ` +
        `first refundable room (${SELECTORS.REFUNDABLE_ROOM_ITEM}). The room list may have re-rendered. ` +
        `Original: ${err.message}`
      );
    }
  }

  /** Counts the room rows currently RENDERED (the infinite-scroll list grows as it is scrolled). */
  async getRoomCount() {
    try {
      return await this.page.locator(SELECTORS.ROOM_ITEM).count();
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.getRoomCount] Could not count the rendered room rows (${SELECTORS.ROOM_ITEM}). ` +
        `The rooms view may have been replaced mid-read. Original: ${err.message}`
      );
    }
  }

  /**
   * Scrolls the LAST rendered room row into view — the gesture that fires the rooms view's
   * infinite-scroll loadMore(), appending the next chunk of rooms to the DOM.
   */
  async scrollToLastRoom() {
    try {
      await this.page.locator(SELECTORS.ROOM_ITEM).last().scrollIntoViewIfNeeded({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.scrollToLastRoom] Could not scroll the last room row into view ` +
        `(${SELECTORS.ROOM_ITEM}). The rooms view may have been replaced mid-scroll. ` +
        `Original: ${err.message}`
      );
    }
  }

  /** Clicks the add-to-cart icon of the first refundable room of the opened hotel. */
  async clickAddFirstRefundableRoomToCart() {
    const icon = this.page
      .locator(SELECTORS.REFUNDABLE_ROOM_ITEM)
      .first()
      .locator(`${SELECTORS.ROOM_ROW_ADD_TO_CART_ICON}:visible`)
      .first();
    try {
      await icon.waitFor({ state: "visible", timeout: 30000 });
      await icon.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickAddFirstRefundableRoomToCart] Could not click the add-to-cart icon of ` +
        `the first refundable room (${SELECTORS.REFUNDABLE_ROOM_ITEM}). The hotel may offer only ` +
        `non-refundable rates, or the room row re-rendered. Original: ${err.message}`
      );
    }
  }

  /** Returns from a hotel's rooms view to the hotel results list. */
  async clickBackToHotelResults() {
    try {
      const link = this.page.locator(SELECTORS.BACK_TO_HOTEL_RESULTS_LINK).first();
      await link.waitFor({ state: "visible", timeout: 20000 });
      await link.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickBackToHotelResults] Could not click "<< Back to hotel results" ` +
        `(${SELECTORS.BACK_TO_HOTEL_RESULTS_LINK}). The rooms view may not be open. ` +
        `Original: ${err.message}`
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
  // ===== Trip cart — seat selection (post-booking) =====

  /** Waits for the trip cart to render its flight quotes' Seating tabs. */
  async waitForSeatingTab({ timeout = 60000 } = {}) {
    try {
      await this.page.locator(SELECTORS.SEATING_TAB).first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForSeatingTab] No flight quote "Seating (...)" tab appeared on the trip cart ` +
        `within ${timeout}ms — the trip may hold no flight, or the cart did not load. Original: ${err.message}`
      );
    }
  }

  /** @returns {Promise<string[]>} Every flight quote's Seating tab text, in cart order. */
  async getSeatingTabTexts() {
    const texts = await this.page.locator(SELECTORS.SEATING_TAB).allInnerTexts();
    return texts.map((t) => t.trim());
  }

  /** Opens the seat popup of the flight quote at a 0-based cart position. */
  async clickSeatingTab(index) {
    try {
      await this.page.locator(SELECTORS.SEATING_TAB).nth(index).click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickSeatingTab] Could not click the Seating tab of flight quote #${index + 1}. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Waits for the CURRENT flight's seat map to offer seats. Supplier seat maps take up to ~30s.
   * A map with no <area> means the supplier returned no selectable seat.
   */
  async waitForSeatMap({ timeout = 150000 } = {}) {
    try {
      await this.page.waitForFunction(
        (selector) => document.querySelectorAll(selector).length > 0,
        SELECTORS.SEAT_MAP_AREA,
        { timeout }
      );
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.waitForSeatMap] The seat popup showed no selectable seat (${SELECTORS.SEAT_MAP_AREA}) ` +
        `within ${timeout}ms — the supplier returned an empty seat map or none at all. Original: ${err.message}`
      );
    }
  }

  /** @returns {Promise<number>} How many flights the open seat popup lists. */
  async getSeatPopupFlightCount() {
    return this.page.locator(`${SELECTORS.SEAT_POPUP_FLIGHT_BUTTON}:visible`).count();
  }

  /** Switches the open seat popup to the flight at a 0-based position. */
  async clickSeatPopupFlight(index) {
    try {
      await this.page.locator(`${SELECTORS.SEAT_POPUP_FLIGHT_BUTTON}:visible`).nth(index).click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickSeatPopupFlight] Could not switch the seat popup to flight #${index + 1}. ` +
        `Original: ${err.message}`
      );
    }
  }

  /**
   * Reads the flight the seat popup currently shows and the seat numbers its map offers.
   * The seat numbers are not in the DOM (the map is an image), so they come from the AngularJS
   * scope each <area> is bound to.
   *
   * @returns {Promise<{flight: string, seats: string[], selected: string[]}>}
   */
  async getCurrentSeatMap() {
    return this.page.evaluate((selector) => {
      const area = document.querySelector(selector);
      const flight = window.angular.element(area).scope().selectedFlight;
      const f = flight.flight || {};
      return {
        flight: `${f.Carrier}${f.FlightNumber} ${f.OriginAirportCode}-${f.DestinationAirportCode}`,
        seats: flight.seatMapMetadata.Seats.map((m) => m.Number),
        selected: (flight.selectedSeatMetadata || []).filter(Boolean).map((m) => m.Number),
      };
    }, SELECTORS.SEAT_MAP_AREA);
  }

  /** Clicks a seat by its number on the current flight's seat map. */
  async clickSeat(seatNumber) {
    const clicked = await this.page.evaluate(
      ({ selector, seat }) => {
        const area = [...document.querySelectorAll(selector)].find(
          (a) => window.angular.element(a).scope().seatMetadata.Number === seat
        );
        if (!area) return false;
        area.click();
        return true;
      },
      { selector: SELECTORS.SEAT_MAP_AREA, seat: seatNumber }
    );
    if (!clicked) {
      throw new Error(`[LegacyGtpPage.clickSeat] Seat "${seatNumber}" is not offered on the current flight's seat map.`);
    }
  }

  /** Clicks the seat popup's "Save" (not "Save and close"). */
  async clickSeatPopupSave() {
    try {
      const button = this.page.locator(`${SELECTORS.SEAT_POPUP_SAVE_BUTTON}:visible`).first();
      await button.waitFor({ state: "visible", timeout: 15000 });
      await button.click({ timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[LegacyGtpPage.clickSeatPopupSave] Could not click the seat popup's Save button — it stays disabled ` +
        `until a seat differs from the saved ones. Original: ${err.message}`
      );
    }
  }
}

module.exports = { LegacyGtpPage, SELECTORS };
