const TripOverviewPage = require('@pages/TripOverviewPage');

/**
 * TripOverview DSL
 *
 * High-level business actions and checks on the Trip Overview.
 * This file describes WHAT the user does, not HOW the UI works.
 */
const TripOverview = {
  /**
   * Cancels a trip.
   *
   * This flow:
   * - confirms we are on the Trip Overview page
   * - opens the actions menu
   * - confirms cancellation
   * - waits for success message
   */
  async cancelTrip(page) {
    const tripOverviewPage = new TripOverviewPage(page);

    // Confirm correct page state
    await tripOverviewPage.waitForDetailsText();
    await tripOverviewPage.waitForTripOverviewTitle();

    // Open actions menu and cancel
    await tripOverviewPage.hoverTripActionsDropdownIcon();
    await tripOverviewPage.waitForDropdownMenu();
    await tripOverviewPage.clickCancelTripOption();

    // Confirm cancellation
    await tripOverviewPage.waitForTripCancellationDialogTitle();
    await tripOverviewPage.clickConfirmTripCancellationButton();
    await tripOverviewPage.waitForTripCancelledMessage();

    // Allow backend and UI to settle
    await page.waitForLoadState('networkidle');

    return { cancelled: true };
  },

  /**
   * Checks if a booking is currently being finalized.
   */
  async isBookingFinalizing(page) {
    const tripOverviewPage = new TripOverviewPage(page);
    return tripOverviewPage.waitForFinalizingText();
  },

  /**
   * Checks if a booking is confirmed.
   */
  async isBookingConfirmed(page) {
    const tripOverviewPage = new TripOverviewPage(page);
    await tripOverviewPage.waitForConfirmedText();
    return true;
  },

  async expectBookingStatus(expectedStatus, { timeout = 5000 } = {}) {
  const actualText = await this.waitForBookingStatusText({ timeout });

  if (!actualText.toLowerCase().includes(expectedStatus.toLowerCase())) {
    throw new Error(
      `Expected booking status to be "${expectedStatus}", but got "${actualText}"`
    );
  }
}

};

module.exports = TripOverview;