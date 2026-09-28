const { toNumber } = require("@utils/numbers");
const { getScrollOffsetFromTop } = require("@utils/dom");
const { normalizeText } = require("@utils/text");

/**
 * Page Object for room level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  VIEW_HOTEL_ON_MAP_BUTTON: "button.map-btn.is-paddingless",
  MAP_MODAL: ".map-modal .google-map-loader, .map-modal .el-dialog__body .google-map-loader",
  // Google Maps only injects .gm-style once the JS API has booted and painted; the
  // .google-map-loader section above is the Vue wrapper and is present the moment the dialog
  // opens, so on its own it cannot tell a rendered map from a map that failed to load.
  MAP_CANVAS: ".map-modal .gm-style",
  // The room-level dialog passes :showPriceMarkers="false", so the hotel is drawn as a NATIVE
  // google.maps.Marker (icon: map-marker.svg) rather than the .hotel-map-marker component used at
  // hotel level - HotelLevelResultsPage.MAP_MARKER would never match here. The build inlines that
  // svg as a data: URI, so there is no filename in the src either; what identifies the pin is the
  // icon's own 32x43 geometry, url-encoded in the SVG header. Nothing else on the map can match it:
  // hotel-marker.svg (corporate POI pins) is 27x43, and the base tiles are 256x256 https imgs from
  // mapsresources-pa.googleapis.com. Probed as an ordered candidate list, the same way
  // CarResultsPage.STATION_MAP_MARKER_CANDIDATES handles native Google markers.
  MAP_HOTEL_MARKER_CANDIDATES: [
    ".map-modal .gm-style img[src^=\"data:image/svg+xml\"][src*=\"width='32'%20height='43'\"]",
    // Fallback if the pin icon is ever resized: any inlined SVG marker on the map.
    '.map-modal .gm-style img[src^="data:image/svg+xml"]',
  ],
  FIRST_ROOM_PRICE_AMOUNT: ".room-list__cards > div:nth-child(1) .price-details-main h4.amount",
  SECOND_ROOM_PRICE_AMOUNT: ".room-list__cards > div:nth-child(2) .price-details-main h4.amount",
  REFUNDABLE_CHECKBOX_LABEL: "label.el-checkbox",
  REFUNDABLE_CHECKBOX_INNER: ".el-checkbox__inner",
  REFUNDABLE_CHECKBOX_INPUT: "input.el-checkbox__original",
  REFUNDABLE_TAG: "div.refundable:has-text('Refundable')",
  REFUNDABLE_FILTER_TITLE: "p.filter-title[title='Refundable']",
  WIFI_FILTER_TITLE: "p.filter-title[title='Wifi']",
  BREAKFAST_FILTER_TITLE: "p.filter-title[title='Breakfast']",
  DEPOSIT_FILTER_TITLE: "p.filter-title[title='Deposit']",
  DEPOSIT_NOT_REQUIRED_FILTER_TITLE: "p.filter-title[title='Deposit not required']",
  FIRST_ROOM_CANCELLATION_POLICY: ".room-list__cards > div:nth-child(1) .ticket-details p",
  MEMBER_BADGE: ".expedia-membership-badge-container",
  FIRST_ROOM_PRICE: ".room-list__cards > div:nth-child(1) .price-details-main",
  MEMBER_PRICE: ".price-txt h4.amount",
  REGULAR_PRICE_BEFORE_DISCOUNT: ".price-txt h6.amount-before-discount",
  CO2_LABEL: ".eco-label",
  CO2_VALUE: ".eco-label .is-size-7",
  NIGHTS_TEXT: ".price-txt .muliSemiBold.gray-2600",
  AMENITY_SPAN: ".room-amenities span",
  ROOM_CARDS_WITH_AMENITIES: ".room-list__cards > div:has(.room-amenities-container)",
  WIFI_INCLUDED: ".room-amenities span:has-text('Wifi included')",
  BREAKFAST_ICON: "img[src*='breakfastIncluded']",
  SUPPLIER_LOGO_IMG: (supplierId) => `.supplier-img img[alt*="${supplierId}"]`,
  // Same logo, matched on the whole icon filename instead of a substring of it. The alt text is the
  // icon path app-img was given ("suppliers/AMADEUS.svg"), so a substring match on "AMADEUS" also
  // matches every "AMADEUS-<chain>.svg" aggregator logo. Absence checks need the narrower match.
  SUPPLIER_LOGO_IMG_EXACT: (supplierId) =>
    `.supplier-img img[alt$="/${supplierId}.svg"], .supplier-img img[alt="${supplierId}.svg"]`,
  // Room loyalty programme badge. Three components render it off the same room.loyaltyProgramName:
  // room-preview.vue as .room-loyalty-logo (desktop) / .mobile-loyalty-logo (mobile) when
  // hotel.service.getLoyaltyProgramIcon() maps the programme to a local asset, and as the
  // .loyalty-fallback-chip text chip when it does not; merged-room-preview.vue uses .loyalty-tag
  // for both. Gated by the IsHotelLoyaltyPointsEnabled feature flag. The logo carries the
  // programme name in its img alt, the chips as their own text - getLoyaltyBadgeLabels() merges both.
  ROOM_LOYALTY_LOGO_IMG: '.room-loyalty-logo img, .mobile-loyalty-logo img, .loyalty-tag img',
  ROOM_LOYALTY_TEXT_CHIP: '.loyalty-fallback-chip, .loyalty-tag:not(:has(img))',
  // Room-level filter panel section titles (h4 used by all filter types)
  ROOM_FILTER_SECTION_HEADING: (text) => `.room-filter h4:has-text("${text}")`,
  // Room filter checkbox by filter title and option text
  ROOM_FILTER_CHECKBOX: (filterName, optionText) =>
    `.room-filter .filter-container:has(h4:has-text("${filterName}")) label.el-checkbox:has-text("${optionText}")`,
  FIRST_ROOM_PRICE_DETAILS_BUTTON: ".room-list__cards > div:nth-child(1) button.is-hidden-mobile",
  PRICE_DETAILS_DIALOG: ".app-dialog .room-price-details, .el-dialog .room-price-details",
  INFO_ICON_IN_DIALOG: "span.material-symbols-outlined",
  TOOLTIP_POPPER: '[role="tooltip"], .el-tooltip__popper, .el-popper',
  TERMS_AND_CONDITIONS_BUTTON: ".room-list button:has-text('Terms & Conditions')",
  // The open T&C dialog. Every room-preview appends its own el-dialog to the body the first time it
  // is opened, and all the helpers below close the dialog on their way out, so :visible is what
  // separates the dialog that is actually open from the hidden leftovers of earlier opens.
  TERMS_AND_CONDITIONS_DIALOG: ".terms-conditions-dialog:visible",
  // Rendered rule lines inside the T&C dialog (app-terms-conditions.vue). They load asynchronously
  // after the dialog opens, so openTermsAndConditionsDialogOnFirstRoom waits on this before any
  // caller reads the body or clicks the footer.
  TERMS_AND_CONDITIONS_CONTENT: ".terms-container",
  // Primary footer button of the T&C dialog (the app-btn with type="primary" in room-preview.vue):
  // it closes the dialog and calls the same selectRoom() as the room card button. Relative to the
  // dialog locator. Keyed on btn--primary rather than the label, which is localized; the sibling
  // Cancel button is type="text" -> btn--text, so it cannot be hit by mistake.
  TERMS_AND_CONDITIONS_ADD_TO_TRIP_BUTTON: ".app-footer button.btn--primary",
  ALL_ROOM_PRICE_AMOUNTS: ".room-list__cards > div .price-details-main h4.amount",
  // Active filter badge tag in the room-filter summary bar
  ROOM_FILTER_SUMMARY_TAG: (text) => `.room-filter-summary .el-tag:has-text("${text}")`,
  // Agreement badge (handshake icon) in room results — target the icon, not the wrapper section
  AGREEMENT_BADGE: '.ticket-agreement .agreement-img',
  // Agreement label span (exact text match, e.g. "Agency rate"), relative to ROOM_CARD so the
  // hotel-info header above the rooms, which renders the same ticket-agreements component, is never matched.
  ROOM_CARD_AGREEMENT_LABEL: (text) => `.ticket-agreement span:text-is("${text}")`,
  // Tooltip content shown on hover over the agreement label (Element Plus renders the popper at
  // body level). :visible skips poppers left in the DOM by earlier hovers.
  AGREEMENT_TOOLTIP_DESCRIPTION: '.el-popper.is-light:visible .agreement-tooltip__description',
  // "Provided by" label inside room-preview (hotel-provided-by.vue)
  PROVIDER_LABEL: '.room-list .provider-label',
  // Hotel name heading (h1) at the top of the room level page - the first piece of
  // real content below the breadcrumb, used as the "top of page" anchor
  HOTEL_NAME_HEADING: 'h1.hotel-name',
  // Hotel address in the room level header (hotel-info.vue rendered by hotel-details.vue).
  // Scoped to the desktop section so it cannot resolve to the mobile variant of the same block.
  HOTEL_ADDRESS: '.hotel-details-desktop .address-distance p',
  // Room list section wrapping the room cards, used to find the element that scrolls
  ROOM_LIST: '.room-list',
  // Room card loading skeleton (card-img-skeleton.vue). Rendered while the rooms load and
  // again below the list for every supplier that has not answered yet, so its absence is
  // what says the room list has stopped growing.
  ROOM_LOADING_SKELETON: '.card-img-skeleton',
  // Room card with "Check cancelation policy" text (note: single 'l' in source)
  // Uses .check-cancellation class which Vue adds when refundableStatus == None
  CHECK_CANCELLATION_POLICY_ROOM: '.room-preview:has(.check-cancellation)',
  CHECK_CANCELLATION_POLICY_ADD_BUTTON: '.add-btn',
  // Terms & conditions dialog that may appear after adding check cancellation policy room
  TERMS_CONDITIONS_ACCEPT_BUTTON: '.app-terms-conditions .ml-auto, .app-terms-conditions button:has-text("Accept")',
  // Price breakdown dialog elements (inside .room-price-details)
  PRICE_BREAKDOWN_NIGHT_PRICE: '.room-price-details tbody td',
  PRICE_BREAKDOWN_SUBTOTAL: '.price-details .price-details-row:first-child .amount',
  PRICE_BREAKDOWN_TOTAL: '.price-details .price-details-row:has-text("Total") .amount',
  // "Taxes and Fees" row inside the price details dialog (label + amount live in the same row)
  TAXES_AND_FEES_ROW: '.room-price-details .price-details-row:has(p:has-text("Taxes and Fees"))',
  // The el-dialog wrapper that hosts the price details breakdown, and its header close (X) button
  PRICE_DETAILS_DIALOG_ROOT: '.el-dialog:has(.room-price-details), .app-dialog:has(.room-price-details)',
  DIALOG_CLOSE_BUTTON: '.el-dialog__headerbtn',
  BREADCRUMB_LINK: (text) => `nav.breadcrumb a:has-text("${text}")`,
  // Slider runway and thumb for the room-level Price filter panel
  ROOM_PRICE_SLIDER_RUNWAY: '.room-filter .price-slider .el-slider__runway',
  ROOM_PRICE_SLIDER_THUMB: '.room-filter .price-slider .el-slider__button-wrapper',
  // GSA per diem banner (gsa-details-banner.vue) shown above the room list, carrying the
  // same limit as the hotel-level banner
  GSA_BANNER: '.gsa-details-banner',
  // Title and limit lines inside the GSA banner, relative to GSA_BANNER
  GSA_BANNER_TITLE: '.gsa-title',
  GSA_BANNER_INFO: '.gsa-info',
  // Room card container
  ROOM_CARD: '.room-list__cards > div',
  // Out of policy badge inside a room card, relative to ROOM_CARD. Scoped to
  // .price-details-oop because room-deposit.vue reuses the .app-out-of-policy class
  // for styling on the deposit note, which is not a policy violation.
  ROOM_CARD_OOP_BADGE: '.price-details-oop .app-out-of-policy',
  // Info icon inside the room OOP badge that opens the policy violation tooltip
  ROOM_CARD_OOP_INFO_ICON: '.price-details-oop .app-out-of-policy span.info-icon',
  // Price amount inside a room card, relative to ROOM_CARD
  ROOM_CARD_PRICE_AMOUNT: '.price-details-main h4.amount',
  // "Deposit Required" note inside a room card (room-deposit.vue), relative to ROOM_CARD.
  // room-deposit.vue reuses the .app-out-of-policy class for styling, so the section is matched on
  // its own text instead — that class alone would also match a genuine policy violation badge.
  // en.json common.depositRequired is "Deposit Required".
  ROOM_CARD_DEPOSIT_REQUIRED: 'section.app-out-of-policy:has-text("Deposit Required")',
  // "Showing {shown} of {total} Results" line above the room list (room-list-bar.vue). Anchored on
  // its own "Showing" text rather than a position, because the same `p.is-size-6` shape is reused
  // by the sibling "{n} clusters" line the bar renders when room merging is enabled.
  ROOM_RESULTS_COUNT_TEXT: '.room-list-sort .actions p:has-text("Showing")',
};

class RoomLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

  /**
   * Gets the refundable checkbox root container locator.
   * @returns {Locator} Playwright locator for the refundable checkbox container
   */
  getRefundableCheckboxRoot() {
    return this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator(SELECTORS.REFUNDABLE_FILTER_TITLE) },
    );
  }

  /**
   * Gets the refundable checkbox inner element locator.
   * @returns {Locator} Playwright locator for the checkbox inner element
   */
  getRefundableCheckboxInner() {
    return this.getRefundableCheckboxRoot().locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
  }

  /**
   * Gets the refundable checkbox input element locator.
   * @returns {Locator} Playwright locator for the checkbox input element
   */
  getRefundableCheckboxInput() {
    return this.getRefundableCheckboxRoot().locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);
  }

  /**
   * Gets the Wi-Fi amenity filter checkbox root container locator.
   * @returns {Locator} Playwright locator for the Wi-Fi checkbox container
   */
  getWifiCheckboxRoot() {
    return this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator(SELECTORS.WIFI_FILTER_TITLE) },
    );
  }

  /**
   * Gets the Breakfast amenity filter checkbox root container locator.
   * @returns {Locator} Playwright locator for the Breakfast checkbox container
   */
  getBreakfastCheckboxRoot() {
    return this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator(SELECTORS.BREAKFAST_FILTER_TITLE) },
    );
  }

  /**
   * Gets the Deposit filter checkbox root container locator.
   * @returns {Locator} Playwright locator for the Deposit checkbox container
   */
  getDepositCheckboxRoot() {
    return this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator(SELECTORS.DEPOSIT_FILTER_TITLE) },
    );
  }

  /**
   * Gets the "Deposit not required" filter checkbox root container locator.
   * @returns {Locator} Playwright locator for the Deposit not required checkbox container
   */
  getDepositNotRequiredCheckboxRoot() {
    return this.page.locator(
      SELECTORS.REFUNDABLE_CHECKBOX_LABEL,
      { has: this.page.locator(SELECTORS.DEPOSIT_NOT_REQUIRED_FILTER_TITLE) },
    );
  }

  // ===== UI INTERACTIONS =====

  /**
   * Extracts the number of nights from the price details suffix in the first room.
   * Format usually: "1 Room · 3 Nights"
   * @returns {Promise<number>} The number of nights
   */
  async getNightsCount() {
    const locators = this.page.locator(SELECTORS.NIGHTS_TEXT);
    await locators.first().waitFor({ state: "visible", timeout: 10000 });
    const count = await locators.count();
    
    for (let i = 0; i < count; i++) {
        const text = await locators.nth(i).innerText();
        // Match "3 Nights" or "3 Night"
        const match = text.match(/(\d+)\s+Night/);
        if (match) {
            return parseInt(match[1], 10);
        }
    }
    
    // Fallback error with more context
    const allTexts = [];
    for (let i = 0; i < count; i++) {
        allTexts.push(await locators.nth(i).innerText());
    }
    throw new Error(`Could not find night count in matching texts: [${allTexts.join(', ')}]`);
  }

  /**
   * Confirms room results page is loaded.
   * Some providers do not show this element, so treat it as optional.
   * @returns {Promise<boolean>} True if visible within timeout, else false.
   */
  async waitForViewHotelOnMapText() {
    const viewOnMap = this.page
      .locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: "View hotel on map" });

    try {
      await viewOnMap.waitFor({ state: "visible", timeout: 60000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Waits for the room-level "View hotel on map" button to be visible.
   */
  async waitForViewHotelOnMapButton() {
    const viewOnMap = this.page
      .locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: "View hotel on map" })
      .first();

    await viewOnMap.waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Clicks the room-level "View hotel on map" button.
   */
  async clickViewHotelOnMapButton() {
    const viewOnMap = this.page
      .locator(SELECTORS.VIEW_HOTEL_ON_MAP_BUTTON, { hasText: "View hotel on map" })
      .first();

    await viewOnMap.scrollIntoViewIfNeeded();
    await viewOnMap.waitFor({ state: "visible", timeout: 15000 });
    await viewOnMap.click();
  }

  /**
   * Waits for the hotel map modal to be visible after clicking the room-level map button.
   */
  async waitForHotelMapModal() {
    await this.page.locator(SELECTORS.MAP_MODAL).first().waitFor({ state: "visible", timeout: 15000 });
  }

  /**
   * Waits for the Google map inside the hotel map modal to actually render, then for the hotel's
   * marker pin to appear on it. Proves the map loaded and the hotel is plotted on it - not merely
   * that the modal opened.
   * @param {number} timeout - Total budget in ms, shared between the canvas and the marker probe
   * @returns {Promise<string>} The marker selector that matched, for logging
   * @throws {Error} If the map never renders, or no marker appears within the budget
   */
  async waitForHotelMapMarker({ timeout = 30000 } = {}) {
    const deadline = Date.now() + timeout;

    try {
      await this.page.locator(SELECTORS.MAP_CANVAS).first().waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.waitForHotelMapMarker] The map modal opened but Google Maps never ` +
          `rendered ("${SELECTORS.MAP_CANVAS}" not visible within ${timeout}ms). Likely causes: the ` +
          `Google Maps script failed to load from its CDN, or the hotel has no coordinates so the ` +
          `map was never centred. Original: ${err.message}`,
      );
    }

    const candidates = SELECTORS.MAP_HOTEL_MARKER_CANDIDATES;
    for (const [index, candidate] of candidates.entries()) {
      // Split whatever is left of the budget across the candidates still to probe, so a leading
      // candidate that never matches cannot starve the ones behind it.
      const remaining = deadline - Date.now();
      const candidateTimeout = Math.max(2000, Math.floor(remaining / (candidates.length - index)));
      const isVisible = await this.page
        .locator(candidate)
        .first()
        .waitFor({ state: "visible", timeout: candidateTimeout })
        .then(() => true)
        .catch(() => false);
      if (isVisible) {
        return candidate;
      }
    }

    throw new Error(
      `[RoomLevelResultsPage.waitForHotelMapMarker] The map rendered but no hotel marker appeared ` +
        `within the ${timeout}ms budget. None of the probed selectors matched: ` +
        `${candidates.map((candidate) => `"${candidate}"`).join(", ")}. Likely causes: the hotel ` +
        `has no loc coordinates, or the pin icon was resized in the app (see the geometry note on ` +
        `MAP_HOTEL_MARKER_CANDIDATES).`,
    );
  }

  /**
   * Checks whether the "Provided by" label is visible in room level results.
   * @param {number} timeout - Maximum wait time in ms
   * @returns {Promise<boolean>}
   */
  async isProviderLabelVisible({ timeout = 10000 } = {}) {
    try {
      await this.page.locator(SELECTORS.PROVIDER_LABEL).first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enables the "Refundable" filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickRefundableCheckbox() {
    const inner = this.getRefundableCheckboxInner();
    const input = this.getRefundableCheckboxInput();

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: "visible" });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle(),
    );
  }

  /**
   * Waits for the "Deposit Required" note on the room card at the given position and returns its
   * text. Positions are 1-based, matching the other first/second-room helpers in this page object.
   *
   * @param {number} position - 1-based room card position in the room list
   * @param {object} options
   * @param {number} options.timeout - Maximum wait time in ms
   * @returns {Promise<string>} The note's text
   */
  async getRoomDepositRequiredText(position, { timeout = 15000 } = {}) {
    const note = this.page
      .locator(SELECTORS.ROOM_CARD)
      .nth(position - 1)
      .locator(SELECTORS.ROOM_CARD_DEPOSIT_REQUIRED)
      .first();

    try {
      await note.scrollIntoViewIfNeeded();
      await note.waitFor({ state: "visible", timeout });
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.getRoomDepositRequiredText] No "Deposit Required" note was visible on room ` +
        `${position} within ${timeout}ms (selector: ${SELECTORS.ROOM_CARD} >> nth=${position - 1} >> ` +
        `${SELECTORS.ROOM_CARD_DEPOSIT_REQUIRED}). Original: ${err.message}`,
      );
    }

    return (await note.innerText()).trim();
  }

  /** Verifies refundable tag appears on room cards */
  async verifyRefundableTagIsVisible() {
    await this.page
      .locator(SELECTORS.REFUNDABLE_TAG)
      .first()
      .waitFor({ state: "visible" });
  }

  async isMemberBadgeVisible() {
    return await this.page.locator(SELECTORS.MEMBER_BADGE).first().isVisible();
  }

  async getMemberBadgeText() {
    const badge = this.page.locator(SELECTORS.MEMBER_BADGE).first();
    try {
      await badge.waitFor({ state: "visible", timeout: 10000 });
      return (await badge.textContent())?.trim() ?? '';
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.getMemberBadgeText] Member badge not visible within 10s (selector: ${SELECTORS.MEMBER_BADGE}). ` +
        `The room results may not have member rate offers, or the page is still loading. Original: ${err.message}`
      );
    }
  }

  async getPriceComparison() {
    const memberPriceText = await this.page.locator(SELECTORS.MEMBER_PRICE).first().innerText();
    const regularPriceText = await this.page.locator(SELECTORS.REGULAR_PRICE_BEFORE_DISCOUNT).first().innerText();
    return {
      memberPrice: parseFloat(memberPriceText.replace(/[^0-9.]/g, '')),
      regularPrice: parseFloat(regularPriceText.replace(/[^0-9.]/g, ''))
    };
  }

  async getCancellationPolicy() {
    return await this.page.locator(SELECTORS.FIRST_ROOM_CANCELLATION_POLICY).first().innerText();
  }

  /**
   * Gets the first displayed room-level price.
   * @returns {Promise<number>} First room price as a number
   */
  async getFirstRoomLevelPrice() {
    const price = this.page.locator(SELECTORS.FIRST_ROOM_PRICE_AMOUNT).first();
    await price.waitFor({ state: 'visible', timeout: 30000 });

    const priceText = (await price.textContent())?.trim() ?? '';
    const parsedPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

    if (Number.isNaN(parsedPrice)) {
      throw new Error(`Could not parse room-level price from text: "${priceText}"`);
    }

    return Math.round(parsedPrice);
  }

  /**
   * Gets the second displayed room-level price (the room option that includes the booking fee).
   * @returns {Promise<number>} Second room price as a number
   */
  async getSecondRoomLevelPrice() {
    const price = this.page.locator(SELECTORS.SECOND_ROOM_PRICE_AMOUNT).first();
    await price.scrollIntoViewIfNeeded({ timeout: 60000 });
    await price.waitFor({ state: 'visible', timeout: 60000 });

    const priceText = (await price.textContent())?.trim() ?? '';
    const parsedPrice = parseFloat(priceText.replace(/[^0-9.]/g, ''));

    if (Number.isNaN(parsedPrice)) {
      throw new Error(`Could not parse second room-level price from text: "${priceText}"`);
    }

    return Math.round(parsedPrice);
  }

  /**
   * Gets all room-level prices from the room list for debugging.
   * @returns {Promise<number[]>} All room prices as rounded numbers
   */
  async getAllRoomLevelPrices() {
    const roomPrices = this.page.locator(SELECTORS.ALL_ROOM_PRICE_AMOUNTS);
    const count = await roomPrices.count();
    const prices = [];
    for (let i = 0; i < count; i++) {
      const text = (await roomPrices.nth(i).textContent())?.trim() ?? '';
      const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
      prices.push({ index: i, text, price: Math.round(parsed) });
    }
    return prices;
  }

  /** Waits until the GSA per diem banner is visible above the room list */
  async waitForGsaBanner({ timeout = 30000 } = {}) {
    await this.page.locator(SELECTORS.GSA_BANNER).first().waitFor({ state: "visible", timeout });
  }

  /**
   * Reads the two lines of the GSA per diem banner.
   * @returns {Promise<{title: string, info: string}>} Banner title and limit lines
   */
  async getGsaBannerText() {
    await this.waitForGsaBanner();

    const banner = this.page.locator(SELECTORS.GSA_BANNER).first();
    const title = (await banner.locator(SELECTORS.GSA_BANNER_TITLE).textContent()) ?? "";
    const info = (await banner.locator(SELECTORS.GSA_BANNER_INFO).textContent()) ?? "";

    return { title: title.trim(), info: info.trim() };
  }

  /**
   * Reads every loaded room card and pairs its displayed price with whether the card
   * carries an out of policy badge. Used to check the policy indicator against a limit.
   * @returns {Promise<Array<{index: number, price: number, isOutOfPolicy: boolean}>>} One entry per card, in display order
   */
  async getRoomPricesWithPolicyIndicator() {
    const cards = this.page.locator(SELECTORS.ROOM_CARD);
    await cards.first().waitFor({ state: "visible", timeout: 30000 });

    const cardCount = await cards.count();
    const rooms = [];

    for (let index = 0; index < cardCount; index++) {
      const card = cards.nth(index);
      const priceText = (await card.locator(SELECTORS.ROOM_CARD_PRICE_AMOUNT).first().textContent()) ?? "";
      const price = toNumber(priceText, `room-level price on card ${index + 1}`);

      const isOutOfPolicy = await card.locator(SELECTORS.ROOM_CARD_OOP_BADGE).first().isVisible();

      rooms.push({ index, price, isOutOfPolicy });
    }

    return rooms;
  }

  /**
   * Hovers the info icon of the first out of policy room card to open its violation tooltip.
   * Scoped to .price-details-oop rather than using CommonPage's page-wide OOP icon, because
   * room-deposit.vue renders its own .app-out-of-policy badge with an identical info icon.
   */
  async hoverFirstOutOfPolicyInfoIcon() {
    const infoIcon = this.page.locator(SELECTORS.ROOM_CARD_OOP_INFO_ICON).first();

    await infoIcon.waitFor({ state: "visible", timeout: 30000 });
    await infoIcon.hover();
  }

  async isCO2LabelVisible({ timeout = 10000 } = {}) {
    const label = this.page.locator(SELECTORS.CO2_LABEL).first();
    try {
      await label.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getCO2Value() {
    const value = this.page.locator(SELECTORS.CO2_VALUE).first();
    await value.waitFor({ state: "visible", timeout: 10000 });
    return (await value.textContent()).trim();
  }
  /**
   * Enables the "Deposit" filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickDepositCheckbox() {
    const root = this.getDepositCheckboxRoot();
    const inner = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
    const input = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: "visible" });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle(),
    );
  }

  /**
   * Enables the "Deposit not required" filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickDepositNotRequiredCheckbox() {
    const root = this.getDepositNotRequiredCheckboxRoot();
    const inner = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
    const input = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: "visible" });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle(),
    );
  }

  /**
   * Enables the "Wi-Fi" amenity filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickWifiCheckbox() {
    const root = this.getWifiCheckboxRoot();
    const inner = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
    const input = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: "visible" });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle(),
    );
  }

  /**
   * Verifies that only Wi-Fi rooms are displayed after the Wi-Fi filter, in two checks:
   *   1. No room card is displayed without an amenities block - a room whose amenities are not
   *      rendered cannot be confirmed as a Wi-Fi room, so it must not pass silently.
   *   2. Every room card that does render amenities shows Wi-Fi.
   * An empty room list fails too - "no rooms" is not "only Wi-Fi rooms".
   * @throws {Error} If no rooms are displayed, or a room has no amenities, or a room has no Wi-Fi
   */
  async verifyAllRoomsHaveWifi() {
    const allRooms = this.page.locator(SELECTORS.ROOM_CARD);
    await allRooms.first().waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator(SELECTORS.AMENITY_SPAN).first().waitFor({ state: "visible", timeout: 15000 });

    const total = await allRooms.count();
    if (total === 0) {
      throw new Error(
        "[RoomLevelResultsPage.verifyAllRoomsHaveWifi] No room cards are displayed, so the Wi-Fi filter result cannot be verified.",
      );
    }

    const roomCards = this.page.locator(SELECTORS.ROOM_CARDS_WITH_AMENITIES);
    const count = await roomCards.count();
    if (count !== total) {
      throw new Error(
        `[RoomLevelResultsPage.verifyAllRoomsHaveWifi] ${total - count} of ${total} displayed rooms show no amenities ` +
        "at all, so their Wi-Fi cannot be confirmed. Only Wi-Fi rooms are expected after the filter.",
      );
    }

    for (let i = 0; i < count; i++) {
      const wifiSpan = roomCards.nth(i).locator(SELECTORS.WIFI_INCLUDED);
      const hasWifi = await wifiSpan.count() > 0;
      if (!hasWifi) {
        throw new Error(
          `[RoomLevelResultsPage.verifyAllRoomsHaveWifi] Room ${i + 1} of ${total} does not have Wi-Fi amenity displayed.`,
        );
      }
    }
  }

  /**
   * Enables the "Breakfast" amenity filter.
   * Waits until the checkbox state is confirmed.
   */
  async clickBreakfastCheckbox() {
    const root = this.getBreakfastCheckboxRoot();
    const inner = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INNER);
    const input = root.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT);

    await inner.scrollIntoViewIfNeeded();
    await inner.waitFor({ state: "visible" });
    await inner.click();

    await this.page.waitForFunction(
      el => el.checked,
      await input.elementHandle(),
    );
  }

  /**
   * Verifies that only breakfast rooms are displayed after the breakfast filter, in two checks:
   *   1. No room card is displayed without an amenities block - a room whose amenities are not
   *      rendered cannot be confirmed as a breakfast room, so it must not pass silently.
   *   2. Every room card that does render amenities shows breakfast.
   * An empty room list fails too - "no rooms" is not "only breakfast rooms".
   * @throws {Error} If no rooms are displayed, or a room has no amenities, or a room has no breakfast
   */
  async verifyAllRoomsHaveBreakfast() {
    const allRooms = this.page.locator(SELECTORS.ROOM_CARD);
    await allRooms.first().waitFor({ state: "visible", timeout: 15000 });
    await this.page.locator(SELECTORS.AMENITY_SPAN).first().waitFor({ state: "visible", timeout: 15000 });

    const total = await allRooms.count();
    if (total === 0) {
      throw new Error(
        "[RoomLevelResultsPage.verifyAllRoomsHaveBreakfast] No room cards are displayed, so the breakfast filter result cannot be verified.",
      );
    }

    const roomCards = this.page.locator(SELECTORS.ROOM_CARDS_WITH_AMENITIES);
    const count = await roomCards.count();
    if (count !== total) {
      throw new Error(
        `[RoomLevelResultsPage.verifyAllRoomsHaveBreakfast] ${total - count} of ${total} displayed rooms show no amenities ` +
        "at all, so their breakfast cannot be confirmed. Only breakfast rooms are expected after the filter.",
      );
    }

    for (let i = 0; i < count; i++) {
      const hasBreakfastIcon = await roomCards.nth(i).locator(SELECTORS.BREAKFAST_ICON).count() > 0;
      const hasBreakfastText = await roomCards.nth(i).locator(SELECTORS.AMENITY_SPAN).filter({ hasText: /breakfast/i }).count() > 0;
      if (!hasBreakfastIcon && !hasBreakfastText) {
        throw new Error(
          `[RoomLevelResultsPage.verifyAllRoomsHaveBreakfast] Room ${i + 1} of ${total} does not have Breakfast amenity displayed.`,
        );
      }
    }
  }

  /**
   * Checks if a supplier logo is visible in room level results.
   * Matches against the supplier ID embedded in the img src attribute.
   *
   * @param {string} supplierId - Supplier ID as it appears in the image URL (e.g. "HCORPO")
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>} True if at least one matching supplier logo is visible
   */
  /**
   * Clicks the "Price details" button on the first room card.
   * This opens a dialog with the price breakdown.
   */
  async clickPriceDetailsButton() {
    const btn = this.page.locator(SELECTORS.FIRST_ROOM_PRICE_DETAILS_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.waitFor({ state: "visible", timeout: 10000 });
    await btn.click();
    // Wait for the price details dialog to appear
    await this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first().waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Hovers over the "Paid at hotel" info icon next to taxes and fees.
   * The icon only appears for Ratehawk rooms inside the price details dialog.
   */
  async hoverPayAtHotelInfoIcon() {
    const dialogContent = this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first();
    await dialogContent.waitFor({ state: "visible", timeout: 10000 });

    const infoIcon = dialogContent.locator(SELECTORS.INFO_ICON_IN_DIALOG).filter({ hasText: "info" }).first();
    await infoIcon.waitFor({ state: "visible", timeout: 10000 });
    await infoIcon.hover();
  }

  /**
   * Gets the tooltip text from the "Paid at hotel" tooltip.
   * Must hover over the info icon first to make the tooltip visible.
   * @returns {Promise<string>} The tooltip text content
   */
  async getPayAtHotelTooltipText() {
    const tooltip = this.page.locator(SELECTORS.TOOLTIP_POPPER).filter({ hasText: "Paid at the hotel" });
    await tooltip.first().waitFor({ state: "visible", timeout: 5000 });
    return (await tooltip.first().textContent()).trim();
  }

  /**
   * Gets the full text of the "Taxes and Fees" row in the price details dialog.
   * The row contains the label and the amount (with its currency symbol), or the
   * word "Included" when the supplier bundles tax into the price.
   * @returns {Promise<string>} Trimmed text content of the taxes and fees row
   */
  async getTaxesAndFeesRowText() {
    const dialog = this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first();
    await dialog.waitFor({ state: "visible", timeout: 10000 });

    const row = this.page.locator(SELECTORS.TAXES_AND_FEES_ROW).first();
    await row.waitFor({ state: "visible", timeout: 10000 });
    return (await row.textContent())?.trim() ?? "";
  }

  /**
   * Closes the price details dialog via its header close button, falling back to
   * the Escape key, then waits until the dialog is dismissed so the next step is
   * not blocked by the overlay.
   */
  async closePriceDetailsDialog() {
    const dialog = this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first();
    await dialog.waitFor({ state: "visible", timeout: 10000 });

    const closeButton = this.page
      .locator(SELECTORS.PRICE_DETAILS_DIALOG_ROOT)
      .locator(SELECTORS.DIALOG_CLOSE_BUTTON)
      .first();

    try {
      await closeButton.waitFor({ state: "visible", timeout: 5000 });
      await closeButton.click();
    } catch {
      await this.page.keyboard.press("Escape");
    }

    await dialog.waitFor({ state: "hidden", timeout: 10000 });
  }

  async isSupplierLogoVisible(supplierId, { timeout = 15000, exact = false } = {}) {
    if (!supplierId || typeof supplierId !== "string") {
      throw new Error(`supplierId must be a non-empty string, got: ${typeof supplierId}`);
    }
    const selector = exact ? SELECTORS.SUPPLIER_LOGO_IMG_EXACT : SELECTORS.SUPPLIER_LOGO_IMG;
    const logo = this.page.locator(selector(supplierId)).first();
    try {
      await logo.waitFor({ state: "visible", timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether a filter section heading with the given text is visible in the room filter panel.
   * @param {string} text - Filter section title (e.g. "Agreement", "Price", "Payment")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isRoomFilterSectionVisible(text, { timeout = 10000 } = {}) {
    if (!text || typeof text !== 'string') throw new Error('text must be a non-empty string');
    const heading = this.page.locator(SELECTORS.ROOM_FILTER_SECTION_HEADING(text)).first();
    try {
      await heading.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks a checkbox option inside a named filter section in the room filter panel.
   * @param {string} filterName - The filter section title (e.g. "Agreement")
   * @param {string} optionText - The checkbox option label (e.g. "Corp")
   */
  async clickRoomFilterOption(filterName, optionText) {
    if (!filterName || typeof filterName !== 'string') throw new Error('filterName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const checkbox = this.page.locator(SELECTORS.ROOM_FILTER_CHECKBOX(filterName, optionText)).first();
    await checkbox.waitFor({ state: 'visible', timeout: 15000 });
    await checkbox.click();
  }

  /**
   * Opens the Terms & Conditions dialog on the first room card and returns a locator for the open
   * dialog. Every T&C helper below closes the dialog on its way out, so each one that needs the
   * dialog has to open it for itself — this is that shared opening.
   * @returns {Promise<import('playwright').Locator>} Locator scoped to the open dialog
   */
  async openTermsAndConditionsDialogOnFirstRoom() {
    const btn = this.page.locator(SELECTORS.TERMS_AND_CONDITIONS_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();

    const dialog = this.page.locator(SELECTORS.TERMS_AND_CONDITIONS_DIALOG).first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    // The terms body (app-terms-conditions) loads asynchronously after the dialog opens. Waiting on
    // it means readers capture the policy text rather than just the title and buttons, and clickers
    // find the footer at its final position. Not fatal on its own, so it never fails the caller.
    await dialog
      .locator(SELECTORS.TERMS_AND_CONDITIONS_CONTENT)
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {});

    return dialog;
  }

  /**
   * Clicks the "Terms and conditions" link on the first room card and waits for the dialog.
   * @returns {Promise<boolean>} True if the dialog is visible after clicking
   */
  async clickTermsAndConditionsButton() {
    const dialog = await this.openTermsAndConditionsDialogOnFirstRoom();
    const isVisible = await dialog.isVisible();
    // Close the dialog so subsequent steps are not blocked by the overlay
    await this.page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });
    return isVisible;
  }

  /**
   * Opens the Terms & Conditions dialog and returns its full text content.
   * Closes the dialog before returning so subsequent steps are not blocked.
   * @returns {Promise<string>} Full text content of the T&C dialog
   */
  async getTermsAndConditionsText() {
    const dialog = await this.openTermsAndConditionsDialogOnFirstRoom();

    const text = (await dialog.textContent()) ?? '';

    await this.page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });

    return text.trim();
  }

  /**
   * Re-opens the Terms & Conditions dialog on the first room and clicks its footer "Add to trip"
   * button, which closes the dialog and selects the room (the app-btn with type="primary" in the
   * dialog footer of room-preview.vue). The re-open is mandatory: every other T&C helper closes the
   * dialog, so by the time this runs there is no open dialog to click in.
   */
  async clickAddToTripInTermsAndConditionsDialog() {
    const dialog = await this.openTermsAndConditionsDialogOnFirstRoom();

    const addToTripBtn = dialog.locator(SELECTORS.TERMS_AND_CONDITIONS_ADD_TO_TRIP_BUTTON).first();
    try {
      await addToTripBtn.waitFor({ state: 'visible', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.clickAddToTripInTermsAndConditionsDialog] "Add to trip" button never appeared in the Terms & Conditions dialog footer. The dialog may have rendered without a footer, or its markup changed. Original: ${err.message}`
      );
    }

    // The app disables this button when the room is restricted or non-refundable
    // (:isDisabled="isRestricted || room.refundableStatus == RoomRefundableStatus.None"). A click on
    // a disabled button is a silent no-op that would only surface much later as a confusing
    // booking-status timeout, so fail here with the real reason.
    if (await addToTripBtn.isDisabled()) {
      throw new Error(
        '[RoomLevelResultsPage.clickAddToTripInTermsAndConditionsDialog] The "Add to trip" button in the Terms & Conditions dialog is disabled, so the room cannot be added from the dialog. The first room is likely restricted or non-refundable.'
      );
    }

    await addToTripBtn.click();

    // The button sets termsAndConditionsDialogVisible = false and then calls selectRoom(), so the
    // dialog closing is the signal that the click actually landed.
    try {
      await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.clickAddToTripInTermsAndConditionsDialog] The Terms & Conditions dialog stayed open after clicking "Add to trip", so the room was not selected. Original: ${err.message}`
      );
    }
  }

  /**
   * Checks if any agreement badge (handshake icon) is visible in room level results.
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isAnyAgreementBadgeVisible({ timeout = 30000 } = {}) {
    try {
      await this.page.locator(SELECTORS.AGREEMENT_BADGE).first().waitFor({ state: 'attached', timeout });
      const count = await this.page.locator(SELECTORS.AGREEMENT_BADGE).count();
      for (let i = 0; i < count; i++) {
        if (await this.page.locator(SELECTORS.AGREEMENT_BADGE).nth(i).isVisible()) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Hovers over an agreement label in the first room card that carries it and returns the tooltip
   * description text.
   * @param {string} labelText - Agreement label text to hover over (e.g. "Agency rate")
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - How long to wait for the label (room list loading)
   * @returns {Promise<string>} The tooltip description text
   */
  async hoverAgreementLabelAndGetTooltip(labelText, { timeout = 30000 } = {}) {
    const span = this.page.locator(SELECTORS.ROOM_CARD).locator(SELECTORS.ROOM_CARD_AGREEMENT_LABEL(labelText)).first();
    await span.waitFor({ state: 'visible', timeout });
    await span.scrollIntoViewIfNeeded();
    await span.hover();
    // Wait for El-Plus tooltip portal to render (open-delay 200ms + render)
    const tooltipDesc = this.page.locator(SELECTORS.AGREEMENT_TOOLTIP_DESCRIPTION).first();
    try {
      await tooltipDesc.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      // Retry: a single hover can lose the race with El-Plus mounting the popper. Move away and give
      // the tooltip time to close (no DOM signal to wait on) so the re-hover fires a fresh pointer-enter.
      await this.page.mouse.move(0, 0);
      await this.page.waitForTimeout(300);
      await span.hover();
      await tooltipDesc.waitFor({ state: 'visible', timeout: 5000 });
    }
    const descText = await tooltipDesc.textContent();
    if (!descText) throw new Error(`Agreement tooltip description not found in DOM after hovering over "${labelText}" in room level results`);
    return descText.trim();
  }

  /**
   * Scans every room card in the room list for the agreement icon (AGREEMENT_BADGE, the same
   * icon isAnyAgreementBadgeVisible checks — resolved per card here instead of page-wide).
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<{ total: number, missingIndexes: number[] }>} Card count and the 0-based
   *   indexes of the cards with no visible agreement icon (empty when every card has one)
   */
  async findRoomsMissingAgreementBadge({ timeout = 30000 } = {}) {
    const cards = this.page.locator(SELECTORS.ROOM_CARD);
    await cards.first().waitFor({ state: 'visible', timeout });
    const total = await cards.count();
    const missingIndexes = [];
    for (let i = 0; i < total; i++) {
      const badge = cards.nth(i).locator(SELECTORS.AGREEMENT_BADGE).first();
      const isVisible = await badge.isVisible().catch(() => false);
      if (!isVisible) missingIndexes.push(i);
    }
    return { total, missingIndexes };
  }

  /**
   * Waits until the browser is actually on a room level URL.
   *
   * The room level route ends in /rooms, so this is what proves the hotel click
   * navigated instead of leaving us on the hotel list. Without it, a scroll
   * assertion could be measuring the previous page.
   */
  async waitForRoomLevelUrl() {
    await this.page.waitForURL(/\/rooms(?:[/?#]|$)/, { timeout: 60000 });
  }

  /**
   * Waits until the room level page has rendered its real content: the hotel name
   * heading and at least one room card, in place of the loading skeletons.
   *
   * This matters for a scroll assertion, because the page grows as the hotel
   * details and each supplier's rooms arrive. Measuring the scroll offset while
   * skeletons are still on screen would read the offset of a page that does not
   * exist yet, and any later scroll jump would go unnoticed.
   */
  async waitForRoomLevelContentLoaded() {
    await this.page.locator(SELECTORS.HOTEL_NAME_HEADING).first().waitFor({ state: 'visible', timeout: 60000 });
    await this.page.locator(SELECTORS.ROOM_CARD).first().waitFor({ state: 'visible', timeout: 60000 });
  }
  /**
   * Waits for the room list to stop growing: every supplier has answered, so no
   * room-loading skeleton is left on the page.
   *
   * Best effort by design - it reports failure instead of throwing. How complete the
   * room list is is not what a scroll assertion is about; it only needs the page to
   * have stopped changing height underneath it, and one supplier that never answers
   * must not turn into a failure of the thing being asserted.
   * @param {number} [timeout=30000]
   * @returns {Promise<boolean>} True if every skeleton went away within the timeout
   */
  async waitForRoomsFinishedLoading(timeout = 30000) {
    try {
      await this.page.waitForFunction(
        (selector) => document.querySelectorAll(selector).length === 0,
        SELECTORS.ROOM_LOADING_SKELETON,
        { timeout },
      );
      return true;
    } catch {
      return false;
    }
  }


  /**
   * Reads how far the room level page is scrolled from its top, covering both the
   * document scroll and any scrollable container wrapping the room list.
   * @returns {Promise<{offset: number, range: number, document: number, container: number, containerDescription: string}>}
   */
  async getDistanceFromPageTop() {
    return getScrollOffsetFromTop(this.page, SELECTORS.ROOM_LIST);
  }

  /**
   * Reads the hotel name from the h1 heading at the top of the room level page.
   * @returns {Promise<string>} The hotel name, whitespace-normalized
   */
  async getHotelNameHeadingText() {
    const heading = this.page.locator(SELECTORS.HOTEL_NAME_HEADING).first();
    await heading.waitFor({ state: 'visible', timeout: 60000 });
    return normalizeText(await heading.innerText());
  }

  /**
   * Reads the hotel address shown in the room level page header.
   * @returns {Promise<string>} The address text, whitespace-normalized
   */
  async getHotelAddressText() {
    const address = this.page.locator(SELECTORS.HOTEL_ADDRESS).first();
    try {
      await address.waitFor({ state: 'visible', timeout: 60000 });
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.getHotelAddressText] Hotel address not visible in the room level header ` +
        `(selector: ${SELECTORS.HOTEL_ADDRESS}). The hotel details header may still be loading. Original: ${err.message}`
      );
    }
    return normalizeText(await address.innerText());
  }

  /**
   * Checks whether the hotel name heading - the first content on the room level
   * page - is inside the viewport.
   *
   * This is the visible-to-a-user half of "displayed at the top": it holds even if
   * the page later scrolls something other than the document, so the assertion
   * cannot pass on a page whose top content is off screen.
   * @returns {Promise<{isInViewport: boolean, top: number|null, viewportHeight: number}>}
   */
  async getHotelNameHeadingPosition() {
    const heading = this.page.locator(SELECTORS.HOTEL_NAME_HEADING).first();
    await heading.waitFor({ state: 'visible', timeout: 30000 });

    const box = await heading.boundingBox();
    const viewportHeight = await this.page.evaluate(() => window.innerHeight);

    return {
      isInViewport: box !== null && box.y >= 0 && box.y < viewportHeight,
      top: box === null ? null : Math.round(box.y),
      viewportHeight,
    };
  }

  /**
   * Finds a room card with "Check cancellation policy" label and clicks its Add to trip button.
   * Scrolls to the room first to ensure visibility.
   * @throws {Error} If no room with "Check cancellation policy" is found
   */
  async clickAddToTripOnCheckCancellationPolicyRoom() {
    const roomCard = this.page.locator(SELECTORS.CHECK_CANCELLATION_POLICY_ROOM).first();
    await roomCard.waitFor({ state: 'visible', timeout: 30000 });
    await roomCard.scrollIntoViewIfNeeded();

    const addButton = roomCard.locator(SELECTORS.CHECK_CANCELLATION_POLICY_ADD_BUTTON);
    await addButton.waitFor({ state: 'visible', timeout: 15000 });
    await addButton.click();
  }

  /**
   * ADO 77842 — adds the room whose name/description matches the given text to the trip.
   * Locates the room card in the room list containing the room name, scrolls to it, and
   * clicks its "Add to trip" button. Used for fixture rooms identified by exact name.
   * @param {string} roomName - Exact room name/description shown on the room card
   */
  async clickAddToTripOnRoomByName(roomName) {
    if (!roomName || typeof roomName !== 'string') {
      throw new Error(`roomName must be a non-empty string, got: ${typeof roomName}`);
    }
    const roomCard = this.page
      .locator('.room-list__cards > div')
      .filter({ hasText: roomName })
      .first();
    await roomCard.waitFor({ state: 'visible', timeout: 30000 });
    await roomCard.scrollIntoViewIfNeeded();

    const addButton = roomCard
      .locator('button')
      .filter({ hasText: /add to trip/i })
      .first();
    await addButton.waitFor({ state: 'visible', timeout: 15000 });
    await addButton.click();
  }

  /**
   * Checks if an active filter badge tag is visible in the room-filter summary bar.
   * @param {string} text - Tag text (e.g. "TMC", "My Corporate")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isFilterTagVisible(text, { timeout = 10000 } = {}) {
    if (!text || typeof text !== 'string') throw new Error('text must be a non-empty string');
    const tag = this.page.locator(SELECTORS.ROOM_FILTER_SUMMARY_TAG(text)).first();
    try {
      await tag.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks whether an option inside a named room-level filter section is checked.
   * The Element Plus input is visually hidden, so the option label is awaited in the DOM and the
   * checked state is read off the input it wraps. A disabled option reports its checked state the
   * same as an enabled one. REFUNDABLE_CHECKBOX_INPUT is the generic el-checkbox input shared by
   * every checkbox on the page, not just the Refundable one.
   * @param {string} filterName - Filter section title (e.g. "Agreement")
   * @param {string} optionText - Option label text (e.g. "TMC")
   * @param {object} [options]
   * @param {number} [options.timeout=10000]
   * @returns {Promise<boolean>}
   */
  async isFilterOptionChecked(filterName, optionText, { timeout = 10000 } = {}) {
    if (!filterName || typeof filterName !== 'string') throw new Error('filterName must be a non-empty string');
    if (!optionText || typeof optionText !== 'string') throw new Error('optionText must be a non-empty string');
    const label = this.page.locator(SELECTORS.ROOM_FILTER_CHECKBOX(filterName, optionText)).first();
    await label.waitFor({ state: 'attached', timeout });
    return label.locator(SELECTORS.REFUNDABLE_CHECKBOX_INPUT).isChecked();
  }

  /**
   * Extracts the first non-empty night price from the price breakdown table.
   * Scans all <td> cells in the breakdown table and returns the first numeric value.
   * @returns {Promise<number>} The night price as a number
   */
  async getPriceBreakdownNightPrice() {
    const dialog = this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first();
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    const cells = dialog.locator('tbody td');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const text = (await cells.nth(i).textContent())?.trim() ?? '';
      const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (!Number.isNaN(parsed) && parsed > 0) return Math.round(parsed);
    }
    throw new Error('Could not find a non-empty night price in the price breakdown table');
  }

  /**
   * Extracts the subtotal price from the price breakdown dialog.
   * @returns {Promise<number>} The subtotal price as a number
   */
  async getPriceBreakdownSubtotal() {
    const dialog = this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first();
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    const subtotal = dialog.locator(SELECTORS.PRICE_BREAKDOWN_SUBTOTAL).first();
    await subtotal.waitFor({ state: 'visible', timeout: 10000 });
    const text = (await subtotal.textContent())?.trim() ?? '';
    const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(parsed)) throw new Error(`Could not parse subtotal from text: "${text}"`);
    return Math.round(parsed);
  }

  /**
   * Extracts the total price from the price breakdown dialog.
   * @returns {Promise<number>} The total price as a number
   */
  async getPriceBreakdownTotal() {
    const dialog = this.page.locator(SELECTORS.PRICE_DETAILS_DIALOG).first();
    await dialog.waitFor({ state: 'visible', timeout: 10000 });
    const total = dialog.locator(SELECTORS.PRICE_BREAKDOWN_TOTAL).last();
    await total.waitFor({ state: 'visible', timeout: 10000 });
    const text = (await total.textContent())?.trim() ?? '';
    const parsed = parseFloat(text.replace(/[^0-9.]/g, ''));
    if (Number.isNaN(parsed)) throw new Error(`Could not parse total from text: "${text}"`);
    return Math.round(parsed);
  }

  /**
   * Handles the terms & conditions/cancellation policy dialog that may appear after adding a room.
   * Clicks accept/proceed if the dialog appears, otherwise does nothing.
   */
  async handleCancellationTermsDialogIfVisible() {
    try {
      const acceptButton = this.page.locator(SELECTORS.TERMS_CONDITIONS_ACCEPT_BUTTON).first();
      await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
      await acceptButton.click();
    } catch {
      // Dialog did not appear, continue
    }
  }

  /**
   * Clicks a breadcrumb link by its text (e.g. "Hotels") to navigate back.
   * @param {string} linkText - The visible text of the breadcrumb link
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   */
  async clickBreadcrumbLink(linkText, { timeout = 15000 } = {}) {
    if (!linkText || typeof linkText !== 'string') throw new Error('linkText must be a non-empty string');
    const link = this.page.locator(SELECTORS.BREADCRUMB_LINK(linkText)).first();
    await link.waitFor({ state: 'visible', timeout });
    await link.click();
  }

  /**
   * Drags the max (right) handle of the room-level Price slider to the given price value.
   * Reads the slider min/max bounds from the Vuex store to calculate the correct pixel position.
   * @param {number} maxPrice - The maximum price value to drag to
   */
  async setMaxPriceFilter(maxPrice) {
    if (typeof maxPrice !== 'number' || maxPrice <= 0) {
      throw new Error(`[RoomLevelResultsPage.setMaxPriceFilter] "maxPrice" must be a positive number, got: ${typeof maxPrice} (${maxPrice})`);
    }
    const runway = this.page.locator(SELECTORS.ROOM_PRICE_SLIDER_RUNWAY).first();
    try {
      await runway.waitFor({ state: 'visible', timeout: 15000 });

      const [sliderMin, sliderMax] = await this.page.evaluate(() => {
        const store = document.querySelector('#app').__vue_app__.config.globalProperties.$store;
        const { priceMinMax } = store.getters['roomStore/roomFilter'];
        return priceMinMax;
      });

      const runwayBox = await runway.boundingBox();
      const targetPercent = Math.min(1, Math.max(0, (maxPrice - sliderMin) / (sliderMax - sliderMin)));
      const targetX = runwayBox.x + runwayBox.width * targetPercent;
      const targetY = runwayBox.y + runwayBox.height / 2;

      // nth(1) is the max (right) thumb in range mode
      const maxThumb = this.page.locator(SELECTORS.ROOM_PRICE_SLIDER_THUMB).nth(1);
      const thumbBox = await maxThumb.boundingBox();

      await this.page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(targetX, targetY, { steps: 20 });
      await this.page.mouse.up();
    } catch (err) {
      throw new Error(`[RoomLevelResultsPage.setMaxPriceFilter] Could not drag price slider to ${maxPrice}. Original: ${err.message}`);
    }
  }

  /**
   * Reads the "Showing {shown} of {total} Results" line above the room list.
   * @param {object} [options]
   * @param {number} [options.timeout=30000]
   * @returns {Promise<string>} The raw line text, whitespace-collapsed
   */
  async getRoomResultsCountText({ timeout = 30000 } = {}) {
    const line = this.page.locator(SELECTORS.ROOM_RESULTS_COUNT_TEXT).first();
    try {
      await line.waitFor({ state: 'visible', timeout });
    } catch (err) {
      throw new Error(
        `[RoomLevelResultsPage.getRoomResultsCountText] The room results count line ` +
        `(selector: ${SELECTORS.ROOM_RESULTS_COUNT_TEXT}) was not visible within ${timeout}ms. Original: ${err.message}`
      );
    }
    return (await line.innerText()).replace(/\s+/g, ' ').trim();
  }

  /**
   * Collects the loyalty programme label of every room that shows a loyalty badge.
   *
   * Reads both renderings of the badge - the programme logo (label = img alt) and the text chip
   * the app falls back to when the programme has no local logo - so the caller does not have to
   * know which form a given chain resolves to.
   *
   * @param {object} [options]
   * @param {number} [options.timeout=30000] - How long to wait for the first badge to appear
   * @returns {Promise<string[]>} Whitespace-collapsed labels, empty when no badge is displayed
   */
  async getLoyaltyBadgeLabels({ timeout = 30000 } = {}) {
    const badges = this.page.locator(
      `${SELECTORS.ROOM_LOYALTY_LOGO_IMG}, ${SELECTORS.ROOM_LOYALTY_TEXT_CHIP}`
    );

    try {
      await badges.first().waitFor({ state: 'visible', timeout });
    } catch {
      return [];
    }

    const labels = await badges.evaluateAll((nodes) =>
      nodes.map((node) => (node.tagName === 'IMG' ? node.getAttribute('alt') : node.textContent) || '')
    );

    return labels.map((label) => label.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
}

module.exports = RoomLevelResultsPage;