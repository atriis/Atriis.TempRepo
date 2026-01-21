const MenuPage = require('@pages/MenuPage');

/**
 * Menu DSL
 *
 * High-level actions triggered from the top navigation menu.
 * This file describes WHAT the user does, not HOW the UI works.
 */
const Menu = {
  /**
   * Opens the "Book a New Trip" flow.
   *
   * Behavior:
   * - Clicks the menu option
   * - Waits for a new browser tab to open
   * - Waits until the new page finishes loading
   *
   * Returns:
   * - The new Playwright page instance
   */
  async bookANewTrip(page) {
    const menuPage = new MenuPage(page);

    // A new tab is expected when clicking "Book a New Trip"
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      menuPage.bookANewTrip()
    ]);

    // Ensure the new page is fully loaded before returning it
    await newPage.waitForLoadState('networkidle');

    return newPage;
  }
};

module.exports = Menu;