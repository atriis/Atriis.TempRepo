// dsl/Checkout.js

const CheckoutPage = require('../pages/CheckoutPage');
const TripOverviewPage = require('../pages/TripOverviewPage');

const Checkout = {
  async bookAndFinalize(page) {
    const checkoutPage = new CheckoutPage(page);
    const tripOverviewPage = new TripOverviewPage(page);

    await checkoutPage.waitForBookingDetailsText();
    await page.waitForTimeout(4000);
    await checkoutPage.waitForBookAndFinalizeButton();
    await checkoutPage.clickBookAndFinalizeButton();
    await page.waitForTimeout(4000);
    await checkoutPage.clickGoToTrip();
    await tripOverviewPage.waitForTripOverviewTitle();

    return { finalized: true };
  }
};

module.exports = Checkout;
