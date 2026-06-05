const { waitForText } = require("@utils/wait");

/**
 * Page Object for menu page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  BOOK_NEW_TRIP_ICON: ".top-container > :nth-child(4) .material-symbols-outlined",
  LOGOUT_ICON: ".logout-icon",
  TRIPS_ICON: "a[href=\"/trips\"]",
  // Language switcher (app-header.vue): the globe icon reveals a hover tooltip
  // listing each enabled language as a ".language-item" row labelled by name.
  LANGUAGE_ICON: ".support-icon",
  LANGUAGE_ITEM: ".language-item",
};

class MenuPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets the "Book a New Trip" icon element.
   * @returns {import('@playwright/test').Locator}
   */
  getBookANewTripIcon() {
    return this.page.locator(SELECTORS.BOOK_NEW_TRIP_ICON);
  }

  /**
   * Gets the logout icon element.
   * @returns {import('@playwright/test').Locator}
   */
  getLogoutIcon() {
    return this.page.locator(SELECTORS.LOGOUT_ICON);
  }

  /**
   * Gets the Trips navigation link element.
   * @returns {import('@playwright/test').Locator}
   */
  getTripsLink() {
    return this.page.locator(SELECTORS.TRIPS_ICON);
  }

  /**
   * Waits for the "Book a New Trip" icon to appear.
   * Extra timeout for CI environments where rendering can be slower.
   */
  async waitForBookANewTripIcon() {
    // Extended timeout for CI environments
    await this.getBookANewTripIcon().waitFor({ state: "visible", timeout: 30000 });
  }

  /** Clicks "Book a New Trip" (this opens a new tab) */
  async clickBookANewTrip() {
    const icon = this.getBookANewTripIcon();
    
    // Ensure element is in viewport and ready
    await icon.scrollIntoViewIfNeeded();
    
    // Wait for element to be stable before clicking
    await icon.waitFor({ state: "visible", timeout: 10000 });
    await icon.waitFor({ state: "attached", timeout: 10000 });
    
    // Click with extended timeout for CI environments
    await icon.click({ timeout: 15000 });
  }

  /**
   * Waits for the logout icon to be visible.
   * Used as confirmation that the user is logged in.
   */
  async waitForLogoutIcon() {
    await waitForText(this.page, SELECTORS.LOGOUT_ICON, "logout");
  }

  /** Clicks logout icon */
  async clickLogout() {
    await this.getLogoutIcon().click();
  }

  /** Opens the Trips page */
  async clickTrips() {
    const tripsLink = this.getTripsLink();
    await tripsLink.waitFor({ state: "visible", timeout: 10000 });
    // Use force click to bypass any overlay issues
    await tripsLink.click({ force: true });
  }

  /**
   * Hovers the language (globe) icon to reveal the language list tooltip.
   */
  async hoverLanguageIcon() {
    const icon = this.page.locator(SELECTORS.LANGUAGE_ICON);
    try {
      await icon.waitFor({ state: "visible", timeout: 10000 });
      await icon.hover();
    } catch (err) {
      throw new Error(`[MenuPage.hoverLanguageIcon] Could not hover the language globe icon (${SELECTORS.LANGUAGE_ICON}). It may be hidden on mobile viewports or the header has not loaded. Original: ${err.message}`);
    }
  }

  /**
   * Selects a language from the hover tooltip by its visible name (e.g. "Italian", "English").
   * Matches the ".language-item" row by text rather than position, since the list of
   * enabled languages varies per corporation.
   * @param {string} languageName - The language name as shown in the list
   */
  async clickLanguageOption(languageName) {
    if (!languageName || typeof languageName !== "string") {
      throw new Error(`[MenuPage.clickLanguageOption] "languageName" must be a non-empty string, got: ${typeof languageName} (${JSON.stringify(languageName)})`);
    }

    const option = this.page.locator(SELECTORS.LANGUAGE_ITEM, { hasText: languageName }).first();
    try {
      await option.waitFor({ state: "visible", timeout: 10000 });
      await option.click({ timeout: 10000 });
    } catch (err) {
      throw new Error(`[MenuPage.clickLanguageOption] Could not select language "${languageName}" from the language list (${SELECTORS.LANGUAGE_ITEM}). The language may not be enabled for this corporation or the tooltip closed before clicking. Original: ${err.message}`);
    }
  }
}

module.exports = MenuPage;
