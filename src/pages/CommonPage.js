const { SELECTORS: GENERAL_SELECTORS } = require("./GeneralElementsPage");
const { extractNumber } = require("@utils/dom");

// Centralized selectors for CommonPage only
const SELECTORS = {

  // Modal buttons
  GO_BACK_BUTTON: "button:has-text('Go back')",

  // 'Out of Policy' indicator
  OOP_TOOLTIP_TEXT: ".mb-1",
  OOP_INFO: ".app-out-of-policy",

  // Share email elements
  SHARE_EMAIL_ELEMENT: '.em_grey_txt'

};

/**
 * CommonPage
 *
 * Low-level UI interactions on results.
 * No logging, no business decisions.
 */
class CommonPage {
  constructor(page) {
    this.page = page;
  }

  // ===== LOCATOR HELPERS =====

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
    return this.page.locator("span.info-icon", { hasText: "info" }).nth(1);
  }

  getShoppingCartIcon() {
  return this.page.locator('span', { hasText: 'shopping_cart' });
 }

  // ===== UI INTERACTIONS =====

  /**
   * Waits until the OOP text is visible
   */
  async waitForOOPVisible() {
    await this.getOOPInfo().waitFor({ state: "visible", timeout: 30000});
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
   */
  async getOOPTooltipText() {
    await this.waitForOOPTooltipVisible();
    const tooltipText = this.page
      .locator(SELECTORS.OOP_TOOLTIP_TEXT);
    return (await tooltipText.textContent())?.trim() ?? "";
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
    await this.page.locator(GENERAL_SELECTORS.PROCEED_BUTTON).click();
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
}

module.exports = {
  CommonPage,
  SELECTORS,
};
