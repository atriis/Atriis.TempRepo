const TripOverviewPage = require('../pages/TripOverviewPage');

const TripOverview = {
  // Performs trip cancellation workflow for any product type
  async cancelTrip(page) {
    const tripOverviewPage = new TripOverviewPage(page);

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

  // Specialized flight trip cancellation with content validation to ensure correct page state
  async cancelFlightTrip(page) {
    const tripOverviewPage = new TripOverviewPage(page);

    console.log('Starting flight trip cancellation with validation...');

    // Wait for 'Flight Details' text display to confirm correct page state
    await tripOverviewPage.waitForFlightDetailsText();
    console.log('Flight details confirmed - Trip overview page is ready');

    // Reuse generic cancellation flow
    return this.cancelTrip(page);
  },

  // Checks if a booking is currently in the finalization process
  async isBookingFinalizing(page) {
    const tripOverviewPage = new TripOverviewPage(page);
    return tripOverviewPage.waitForFinalizingText();
  }
};

module.exports = TripOverview;
