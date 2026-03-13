const { extractNumber } = require("@utils/dom");

/**
 * Page Object for common elements across pages.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  // Proceed and Save buttons
  PROCEED_BUTTON: "button:has-text('Proceed')",
  SAVE_BUTTON: "button:has-text('Save')",

  // Modal buttons
  GO_BACK_BUTTON: "button:has-text('Go back')",

  // 'Out of Policy' indicator
  OOP_TOOLTIP_TEXT: ".mb-1",
  OOP_INFO: ".app-out-of-policy",

  // Share email elements
  SHARE_EMAIL_ELEMENT: '.em_grey_txt',

  // Price elements
  AMOUNT_VALUE: ".amount",

  // Mandatory notification banner (trip-cart.vue)
  MANDATORY_NOTIFICATION: ".unread-messages",
  MANDATORY_NOTIFICATION_LINK: ".open-notifications",

  // Notification panel close button
  NOTIFICATION_PANEL_CLOSE: '.app-notification .close',

  // Shopping cart icon
  SHOPPING_CART_ICON: 'span:has-text("shopping_cart")',
};

class CommonPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the Out of Policy indicator locator.
   * @returns {Locator} Playwright locator for the OOP indicator
   */
  getOOPInfo() {
    return this.page.locator(SELECTORS.OOP_INFO);
  }

  /**
   * Gets the Out of Policy info icon locator.
   * @returns {Locator} Playwright locator for the OOP info icon
   */
  getOOPInfoIcon() {
    return this.page.locator(SELECTORS.OOP_INFO).locator("span.info-icon", { hasText: "info" }).first();
  }

  getShoppingCartIcon() {
    return this.page.locator(SELECTORS.SHOPPING_CART_ICON);
  }

  /**
   * Waits until the OOP text is visible
   */
  async waitForOOPVisible() {
    // Use .first() to avoid strict mode violation when multiple OOP indicators are present on the page
    await this.getOOPInfo().first().waitFor({ state: "visible", timeout: 30000});
  }

  /**
   * Waits until the OOP text is hidden
   */
  async waitForOOPNotVisible() {
    await this.getOOPInfo().waitFor({ state: "hidden", timeout: 30000 });
  }

  /**
   * Hovers over the Out of Policy info icon to reveal tooltip.
   * TODO: Move this to ResultsPage - this is specific to results page.
   */
  async hoverOverOOPInfoIcon() {
    await this.getOOPInfoIcon().hover();
  }

  /**
   * Waits until the OOP tooltip is visible
   */
  async waitForOOPTooltipVisible() {
    await this.getOOPInfoIcon().waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Retrieves the Out of Policy tooltip text.
   *
   * Returns the trimmed text content or empty string if not found.
   * Uses `li.mb-1` to avoid strict mode violation with generic `.mb-1` elements on the page.
   */
  async getOOPTooltipText() {
    await this.waitForOOPTooltipVisible();
    const tooltipText = this.page.locator('li' + SELECTORS.OOP_TOOLTIP_TEXT);
    return (await tooltipText.first().textContent())?.trim() ?? "";
  }

  /**
   * Retrieves the Out of Policy tooltip text from the cart page.
   * Uses nth(2) because the cart tooltip is the third .mb-1 element on the page.
   *
   * @returns {Promise<string>} Trimmed text content or empty string if not found.
   */
  async getOOPTooltipTextCart() {
    await this.waitForOOPTooltipVisible();
    const tooltipText = this.page.locator(SELECTORS.OOP_TOOLTIP_TEXT).nth(2);
    return (await tooltipText.textContent())?.trim() ?? "";
  }

  /**
   * Waits for the Flight Capacity Restriction pop-up to be displayed.
   */
  async waitFlightCapacityRestrictionPopUpOOPDisplayed() {
    await this.page.getByRole("heading", {
      name: "Flight Capacity Restriction",
      level: 2,
    }).waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Clicks 'Proceed anyway' button on the Flight Capacity Restriction pop-up.
   */
  async clickProceedAnywayOnFlightCapacityRestrictionPopUp() {
    await this.page.locator(SELECTORS.PROCEED_BUTTON).click();
  }

  /**
   * Gets the Success notification locator.
   * @returns {Locator} Playwright locator for the Success notification.
   */
  getSuccessNotification() {
    return this.page.getByText("Success", { exact: true });
  }

  /**
   * Gets the Proceed button element.
   * @returns {import('@playwright/test').Locator}
   */
  getProceedButton() {
    return this.page.locator(SELECTORS.PROCEED_BUTTON);
  }

  /**
   * Gets the Save button element.
   * @returns {import('@playwright/test').Locator}
   */
  getSaveButton() {
    return this.page.locator(SELECTORS.SAVE_BUTTON);
  }

  /**
   * Clicks the Proceed button.
   */
  async clickProceedButton() {
    await this.getProceedButton().click();
  }

  /**
   * Clicks the Proceed button if it becomes visible within timeout.
   * Does nothing and returns false if the button never appears.
   * @param {number} timeout - Max ms to wait for the button (default: 10000)
   * @returns {Promise<boolean>} True if clicked, false if not displayed
   */
  async clickProceedButtonIfVisible(timeout = 10000) {
    const button = this.getProceedButton();
    const isVisible = await button.isVisible();

    if (!isVisible) {
      // Wait for button to potentially appear after async operations
      const appeared = await button.waitFor({ state: 'visible', timeout }).then(() => true, () => false);
      if (!appeared) return false;
    }

    await button.click();
    return true;
  }

  /**
   * Clicks the Save button.
   */
  async clickSaveButton() {
    await this.getSaveButton().click();
  }

  /**
   * Clicks 'Go back' button on the Flight Capacity Restriction pop-up.
   */
  async clickGoBackOnFlightCapacityRestrictionPopUp() {
    await this.page.locator(SELECTORS.GO_BACK_BUTTON).click();
  }

  //This can be used when sharing quotes or itinerary from Results page as well
  /**
   * Waits until the "Subject" label is visible.
   */
  async waitForSubjectLabelSharePopUp() {
    const subjectLabel = this.page.getByText("Subject", { exact: true });

    await subjectLabel.waitFor({ state: "visible", timeout: 30000 });
  }

  /**
   * Extracts price from email preview for a specific flight offer.
   * Searches both main page and iframes (email preview).
   * 
   * @param {number} index - Index of the price element in the email   * @returns {Promise<number|null>} The price value
   */
  async getPriceFromEmailOffer(index) {
    // Try main page first
    const mainPageElements = this.page.locator(SELECTORS.SHARE_EMAIL_ELEMENT);
    if ((await mainPageElements.count()) > index) {
      const price = await extractNumber(this.page, SELECTORS.SHARE_EMAIL_ELEMENT, index);
      if (price !== null) return price;
    }
    
    // Search in iframes (email preview case)
    for (const frame of this.page.frames()) {
      if (frame === this.page.mainFrame()) continue;
      
      const frameElements = frame.locator(SELECTORS.SHARE_EMAIL_ELEMENT);
      if ((await frameElements.count()) > index) {
        return extractNumber(frame, SELECTORS.SHARE_EMAIL_ELEMENT, index);
      }
    }
    
    return null;
  }

  /**
   * Scrolls a flight offer into view within the share dialog or email preview.
   * Searches both the main page and iframes to locate the offer.
   * 
   * @param {number} offerNumber - Flight offer number (1 for first, 2 for second)
   * @param {number} timeout - Maximum time to wait for the offer to be visible (default: 30000ms)
   * @returns {Promise<void>}
   * @throws {Error} If the offer is not found in main page or any iframe
   */
  async scrollIntoViewOffer(offerNumber = 1, timeout = 30000) {
    const offerText = `Flight Offer # ${offerNumber} Pending booking`;

    // Try main page first
    const offer = this.page.getByText(offerText, { exact: true });

    if (await offer.count()) {
      await offer.first().scrollIntoViewIfNeeded();
      await offer.first().waitFor({ state: 'visible', timeout });
      return;
    }

    // Fallback: search inside iframes (email / preview cases)
    for (const frame of this.page.frames()) {
      if (frame === this.page.mainFrame()) continue;

      const inFrame = frame.getByText(offerText, { exact: true });
      if (await inFrame.count()) {
        await inFrame.first().scrollIntoViewIfNeeded();
        await inFrame.first().waitFor({ state: 'visible', timeout });
        return;
      }
    }

    throw new Error(`Offer not found: "${offerText}"`);
  }

  /**
   * Clicks the shopping cart icon to navigate to cart.
   */
  async clickTripCart() {
    await this.getShoppingCartIcon().click();
  }

  /**
   * Checks if the mandatory notification banner is visible.
   * @param {object} [options]
   * @param {number} [options.timeout=15000]
   * @returns {Promise<boolean>}
   */
  async isMandatoryNotificationVisible({ timeout = 15000 } = {}) {
    const notification = this.page.locator(SELECTORS.MANDATORY_NOTIFICATION).first();
    try {
      await notification.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the mandatory notification link to open and dismiss it.
   */
  async clickMandatoryNotificationLink() {
    const link = this.page.locator(SELECTORS.MANDATORY_NOTIFICATION_LINK).first();
    await link.waitFor({ state: 'visible', timeout: 15000 });
    await link.click();
  }

  /**
   * Closes the notification panel by clicking the close button.
   */
  async closeNotificationPanel() {
    const closeBtn = this.page.locator(SELECTORS.NOTIFICATION_PANEL_CLOSE).first();
    await closeBtn.waitFor({ state: 'visible', timeout: 15000 });
    await closeBtn.click();
  }

  /**
   * Extracts the displayed price amount from any page.
   * 
   * @param {number} index - Zero-based index of the amount element (default: 0)
   * @returns {Promise<number|null>} The price value or null if not found
   * @example
   *   getAmountPriceValue(0)  → first price
   *   getAmountPriceValue(1)  → second price
   */
  async getAmountPriceValue(index = 0) {
    return extractNumber(this.page, SELECTORS.AMOUNT_VALUE, index);
  }

  /**
   * Gets a heading element by its text content.
   * @param {string} text - The text content of the heading
   * @returns {Locator} Playwright locator for the heading
   */
  getHeadingByText(text) {
    return this.page.getByRole('heading', { name: text });
  }

  /**
   * Checks if a heading with the given text is visible.
   * @param {string} text - The text content of the heading to check
   * @param {number} timeout - Maximum wait time (default: 30000ms)
   * @returns {Promise<boolean>} True if heading is visible
   */
  async isHeadingVisible(text, { timeout = 30000 } = {}) {
    try {
      await this.getHeadingByText(text).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates and asserts CO2 eco-label is displayed with valid numeric value.
   * 
   * @param {() => Promise<boolean>} isCO2LabelVisible - Async fn that returns true if label is visible
   * @param {() => Promise<string>}  getCO2Value       - Async fn that returns the CO2 text value
   * @param {string}                 context           - Human-readable location for error messages
   * @returns {Promise<{visible: boolean, value: string}>}
   * @throws {Error} If CO2 label is not visible or value is not a positive number
   */
  async assertCO2Displayed(isCO2LabelVisible, getCO2Value, context) {
    const isVisible = await isCO2LabelVisible();
    if (!isVisible) {
      throw new Error(`CO2 eco-label is not visible in ${context}`);
    }

    const value = await getCO2Value();
    const numericValue = parseFloat(value.replace(/,/g, ''));

    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error(`CO2 value must be a positive number, got: "${value}" (${context})`);
    }

    return { visible: true, value };
  }
}

module.exports = {
  CommonPage,
  SELECTORS,
};
