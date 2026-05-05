/**
 * Page Object for room level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  VIEW_HOTEL_ON_MAP_BUTTON: "button.map-btn.is-paddingless",
  MAP_MODAL: ".map-modal .google-map-loader, .map-modal .el-dialog__body .google-map-loader",
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
  TERMS_AND_CONDITIONS_DIALOG: ".terms-conditions-dialog",
  ALL_ROOM_PRICE_AMOUNTS: ".room-list__cards > div .price-details-main h4.amount",
  // Active filter badge tag in the room-filter summary bar
  ROOM_FILTER_SUMMARY_TAG: (text) => `.room-filter-summary .el-tag:has-text("${text}")`,
  // Agreement badge (handshake icon) in room results — target the icon, not the wrapper section
  AGREEMENT_BADGE: '.ticket-agreement .agreement-img',
  // "Provided by" label inside room-preview (hotel-provided-by.vue)
  PROVIDER_LABEL: '.room-list .provider-label',
  // Room level results header ("Showing X rooms" text)
  ROOM_RESULTS_HEADER: '.is-6',
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
  BREADCRUMB_LINK: (text) => `nav.breadcrumb a:has-text("${text}")`,
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
   * Verifies that all visible room cards have the Wi-Fi amenity displayed.
   * @throws {Error} If any room card does not show Wi-Fi amenity
   */
  async verifyAllRoomsHaveWifi() {
    await this.page.locator(SELECTORS.AMENITY_SPAN).first().waitFor({ state: "visible", timeout: 15000 });

    const roomCards = this.page.locator(SELECTORS.ROOM_CARDS_WITH_AMENITIES);
    const count = await roomCards.count();

    for (let i = 0; i < count; i++) {
      const wifiSpan = roomCards.nth(i).locator(SELECTORS.WIFI_INCLUDED);
      const hasWifi = await wifiSpan.count() > 0;
      if (!hasWifi) {
        throw new Error(`Room ${i + 1} does not have Wi-Fi amenity displayed`);
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
   * Verifies that all visible room cards have the Breakfast amenity displayed.
   * @throws {Error} If any room card does not show Breakfast amenity
   */
  async verifyAllRoomsHaveBreakfast() {
    await this.page.locator(SELECTORS.AMENITY_SPAN).first().waitFor({ state: "visible", timeout: 15000 });

    const roomCards = this.page.locator(SELECTORS.ROOM_CARDS_WITH_AMENITIES);
    const count = await roomCards.count();

    for (let i = 0; i < count; i++) {
      const hasBreakfastIcon = await roomCards.nth(i).locator(SELECTORS.BREAKFAST_ICON).count() > 0;
      const hasBreakfastText = await roomCards.nth(i).locator(SELECTORS.AMENITY_SPAN).filter({ hasText: /breakfast/i }).count() > 0;
      if (!hasBreakfastIcon && !hasBreakfastText) {
        throw new Error(`Room ${i + 1} does not have Breakfast amenity displayed`);
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

  async isSupplierLogoVisible(supplierId, { timeout = 15000 } = {}) {
    if (!supplierId || typeof supplierId !== "string") {
      throw new Error(`supplierId must be a non-empty string, got: ${typeof supplierId}`);
    }
    const logo = this.page.locator(SELECTORS.SUPPLIER_LOGO_IMG(supplierId)).first();
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
   * Clicks the "Terms and conditions" link on the first room card and waits for the dialog.
   * @returns {Promise<boolean>} True if the dialog is visible after clicking
   */
  async clickTermsAndConditionsButton() {
    const btn = this.page.locator(SELECTORS.TERMS_AND_CONDITIONS_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();
    const dialog = this.page.locator(SELECTORS.TERMS_AND_CONDITIONS_DIALOG).first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
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
    const btn = this.page.locator(SELECTORS.TERMS_AND_CONDITIONS_BUTTON).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.waitFor({ state: 'visible', timeout: 15000 });
    await btn.click();

    const dialog = this.page.locator(SELECTORS.TERMS_AND_CONDITIONS_DIALOG).first();
    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    const text = (await dialog.textContent()) ?? '';

    await this.page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });

    return text.trim();
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
   * Checks if the page is scrolled to the top (scrollY close to 0).
   * @returns {Promise<boolean>} True if the page is at the top
   */
  async isPageScrolledToTop() {
    const scrollY = await this.page.evaluate(() => window.scrollY);
    return scrollY < 50;
  }

  /**
   * Waits for the room level results header ("Showing" text) to be visible.
   * Used to confirm the room level page has loaded.
   */
  async waitForRoomResultsHeader() {
    await this.page.locator(SELECTORS.ROOM_RESULTS_HEADER).first().waitFor({ state: 'visible', timeout: 60000 });
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
}

module.exports = RoomLevelResultsPage;