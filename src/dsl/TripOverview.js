const TripOverviewPage = require('../pages/TripOverviewPage');

const TripOverview = {
  // Performs trip cancellation workflow for any product type
  async cancelTrip(page) {
    const tripOverviewPage = new TripOverviewPage(page);

    console.log('Starting trip cancellation with "Details" validation...');
    // Wait for '"Details' text display to confirm correct page state
    await tripOverviewPage.waitForDetailsText();
    console.log('"Details" loaded - Trip overview page is ready');

    console.log('Starting trip cancellation flow...');

    // Ensure we are on the Trip overview page
    await tripOverviewPage.waitForTripOverviewTitle();

    // Hover the three dots menu
    await tripOverviewPage.hoverTripActionsDropdownIcon();

    // Wait for dropdown to be visible
    await tripOverviewPage.waitForDropdownMenu();

    // Click cancel trip option
    await tripOverviewPage.clickCancelTripOption();

    // Wait for confirmation modal
    await tripOverviewPage.waitForTripCancellationDialogTitle();

    // Click confirm button
    await tripOverviewPage.clickConfirmTripCancellationButton();

    // Wait for success message and page to settle
    await tripOverviewPage.waitForTripCancelledMessage();

    // Extra wait to ensure stability
    await page.waitForLoadState('networkidle');

    console.log('Trip cancellation completed successfully');
    return { cancelled: true };
  },

  // Checks if a booking is currently in the finalization process
  async isBookingFinalizing(page) {
    const tripOverviewPage = new TripOverviewPage(page);
    return tripOverviewPage.waitForFinalizingText();
  },

  // Checks if a booking is confirmed
  async isBookingConfirmed(page) {
    console.log('Checking if booking is confirmed...');
    const tripOverviewPage = new TripOverviewPage(page);
    await tripOverviewPage.waitForConfirmedText();
    console.log('Booking confirmed successfully');
    return true;
  }
};

module.exports = TripOverview;
