const MenuPage = require('../pages/MenuPage');

const Menu = {
  // Opens a new trip booking page by navigating through the main menu
  // Handles new browser tab creation and waits for complete page loading
  async bookANewTrip(page) {
    console.log('Opening new trip booking through menu...');
    const menuPage = new MenuPage(page);

    // Wait for new page to be created when clicking "Book a New Trip"
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      menuPage.bookANewTrip()
    ]);

    // Wait for the new page to load
    await newPage.waitForLoadState('networkidle');

    console.log('New trip booking page opened');
    return newPage; // Return the new page object for subsequent operations
  }
};

module.exports = Menu;
