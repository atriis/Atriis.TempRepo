// dsl/TripOverview.js

const TripOverviewPage = require('../pages/TripOverviewPage');

const TripOverview = {
  async cancelTrip(page) {
    const tripOverviewPage = new TripOverviewPage(page);

    console.log('Starting trip cancellation flow...');
    
    // Ensure we are on the Trip overview page
    await tripOverviewPage.waitForTripOverviewTitle();

    // Step 1: Hover the three dots menu
    await tripOverviewPage.hoverTripActionsDropdownIcon();
    
    // Step 2: Wait for dropdown to be visible
    await tripOverviewPage.waitForDropdownMenu();
    
    // Step 3: Click cancel trip option
    await tripOverviewPage.clickTripCancellationOption();
    
    // Step 4: Wait for confirmation modal
    await tripOverviewPage.waitForTripCancellationDialogTitle();
    
    // Step 5: Click confirm button
    await tripOverviewPage.clickConfirmTripCancellationButton();
    
    // Step 6: Wait for success message and page to settle
    await tripOverviewPage.waitForTripCancelledMessage();
    
    // Step 7: Optional wait for page to fully update
    await page.waitForLoadState('networkidle');
    
    console.log('Trip cancellation completed successfully');
    return { cancelled: true };
  },

  // Simplified high-level wrapper for flight trip cancellation
  async cancelFlightTrip(page) {
    const tripOverviewPage = new TripOverviewPage(page);
    return await tripOverviewPage.cancelFlightTrip();
  },

  async isBookingFinalizing(page) {
    const tripOverviewPage = new TripOverviewPage(page);
    return tripOverviewPage.waitForFinalizingText();
  }

};

module.exports = TripOverview;
