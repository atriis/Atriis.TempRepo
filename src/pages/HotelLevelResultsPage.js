const { SELECTORS: RESULTS_SELECTORS } = require("@pages/ResultsPage");

/**
 * Page Object for hotel level results page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  MEMBER_BADGE: ".expedia-membership-badge-container, .booking-com-membership-badge-container",
  SEARCH_HOTEL_FILTER: '[placeholder="Search hotel"]'
};

class HotelLevelResultsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "View rates" button locator.
   * @returns {Locator} Playwright locator for the first "View rates" button
   */
  getViewRatesButton() {
    return this.page
      .locator(`${RESULTS_SELECTORS.RESULTS_BUTTON}:has-text("View rates")`)
      .first();
  }

  /** Scrolls to the first "View rates" button */
  async scrollToFirstViewRatesButton() {
    const viewRatesButton = this.getViewRatesButton();

    // Ensure the button exists before trying to scroll to it
    await viewRatesButton.waitFor({ state: "attached" });

    await viewRatesButton.scrollIntoViewIfNeeded();
  }

  /** Waits until the first "View rates" button is visible (60s timeout for CI/CD) */
  async waitForViewRatesText() {
    const viewRatesButton = this.getViewRatesButton();

    // Ensure the button exists, then scroll it into view (60s timeout for slower CI environments)
    await viewRatesButton.waitFor({ state: "attached", timeout: 60000 });
    await viewRatesButton.scrollIntoViewIfNeeded({ timeout: 60000 });

    // Confirm it is visible and ready for interaction (60s timeout)
    await viewRatesButton.waitFor({ state: "visible", timeout: 60000 });
  }

  /** Clicks the first available "View rates" button */
  async clickFirstViewRatesButton() {
    await this.getViewRatesButton().click();
  }

  /**
   * Verifies member rate badge is visible in hotel results
   * @returns {Promise<boolean>} True if member badge is visible
   */
  async isMemberBadgeVisible() {
    const badge = this.page.locator(SELECTORS.MEMBER_BADGE).first();
    try {
      await badge.waitFor({ state: "visible", timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks on the first hotel that displays a member rate badge
   * @throws {Error} If no hotel with member badge is found
   */
  async clickFirstHotelWithMemberRate() {
    // Find all hotel previews that have a member badge
    const hotelWithBadge = this.page.locator('.hotel-preview').filter({ has: this.page.locator(SELECTORS.MEMBER_BADGE) }).first();
    
    // Get the View Rates button within that hotel card
    const viewRatesButton = hotelWithBadge.locator(`${RESULTS_SELECTORS.RESULTS_BUTTON}:has-text("View rates")`);
    
    await viewRatesButton.waitFor({ state: "visible", timeout: 10000 });
    await viewRatesButton.scrollIntoViewIfNeeded();
    await viewRatesButton.click();
  }

  /** Waits for View Rates text to be visible in results page */
  async waitForViewRatesTextInResultsPage() {
    await this.getViewRatesButton().waitFor({ state: "visible" });
  }

  async filterByHotelName(hotelName) {
    await this.page.locator(SELECTORS.SEARCH_HOTEL_FILTER).fill(hotelName);
  }
}

module.exports = HotelLevelResultsPage;
