const MenuPage = require('../pages/MenuPage');
const TripsPage = require('../pages/TripsPage');

const Trips = {
  // Navigates to the Trips page from any page in the application
  // Confirms successful navigation by waiting for key page elements to load
  async navigateToTripsPage(page) {
    console.log('Navigating to Trips page...');
    const menuPage = new MenuPage(page);
    const tripsPage = new TripsPage(page);

    // Navigate to Trips via menu
    await menuPage.clickTrips();
    
    // Wait for page to load and verify we're on the correct page
    await tripsPage.waitForFoundTripsText();
    await tripsPage.tripStatusFilterTextDisplayed();
    
    console.log('Successfully navigated to Trips page');
  }
};

module.exports = Trips;