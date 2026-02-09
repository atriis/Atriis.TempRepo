const { SELECTORS: GENERAL_SELECTORS } = require("./GeneralElementsPage");

// Centralized selectors for CommonPage only
const SELECTORS = {

  // Modal buttons
  GO_BACK_BUTTON: "button:has-text('Go back')",

  // 'Out of Policy' indicator
  OOP_TOOLTIP_TEXT: ".mb-1",
  OOP_INFO: ".app-out-of-policy",

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
}

module.exports = {
  CommonPage,
  SELECTORS,
};
