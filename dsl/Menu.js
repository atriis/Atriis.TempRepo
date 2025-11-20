// dsl/Menu.js
const MenuPage = require('../pages/MenuPage');

const Menu = {
  // Combined DSL action: wait → click Book a New Trip
  // High-level action to book a new trip (opens new tab)
  async bookANewTrip(page) {
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
