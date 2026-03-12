require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Checkout } = require("@dsl");
const logger = require("@utils/logger").child("Checkout");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I complete the booking", async function () {
  logger.info("Completing booking");
  await Checkout.bookAndFinalize(this.page);
});

When("I complete the booking without navigating to trip overview", async function () {
  logger.info("Completing booking without navigating to trip overview");
  await Checkout.bookTripWithoutNavigatingToTripOverview(this.page);
});

Then("a booking error message should be displayed", async function () {
  logger.info("Verifying booking error message is displayed");
  await Checkout.verifyBookingErrorMessage(this.page);
});

When("I click back to trip", async function () {
  logger.info("Clicking back to trip button");
  await Checkout.clickBackToTripButton(this.page);
});

When("I navigate to cart from checkout", async function () {
  logger.info("Navigating to cart from checkout page");
  await Checkout.navigateToCartFromCheckout(this.page);
});
