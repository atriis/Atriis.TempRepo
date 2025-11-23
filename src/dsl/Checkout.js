const CheckoutPage = require('../pages/CheckoutPage');
const TripOverviewPage = require('../pages/TripOverviewPage');

const Checkout = {
  // Completes the entire booking finalization process from checkout to trip overview
  async bookAndFinalize(page) {
    console.log('Starting booking finalization process...');
    const checkoutPage = new CheckoutPage(page);
    const tripOverviewPage = new TripOverviewPage(page);

    await checkoutPage.waitForBookingDetailsText();
    await page.waitForTimeout(4000);
    await checkoutPage.waitForBookAndFinalizeButton();
    await checkoutPage.clickBookAndFinalizeButton();
    await page.waitForTimeout(4000);
    await checkoutPage.clickGoToTrip();
    await tripOverviewPage.waitForTripOverviewTitle();

    console.log('Booking finalization completed successfully');
    return { finalized: true };
  }
};

module.exports = Checkout;
