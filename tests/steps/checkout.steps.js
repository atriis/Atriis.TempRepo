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

When("I complete the Fusion credit card verification booking", async function () {
  logger.info("Completing booking with Fusion card verification");
  await Checkout.bookAndFinalizeWithFusionCardVerification(this.page);
});

When("I complete the booking without navigating to trip overview", async function () {
  logger.info("Completing booking without navigating to trip overview");
  await Checkout.bookTripWithoutNavigatingToTripOverview(this.page);
});

When("I send booking for approval", async function () {
  logger.info("Sending booking for approval");
  await Checkout.sendForApprovalAndFinalize(this.page);
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

When("I uncheck contact sharing and edit the phone to {string}", async function (phone) {
  logger.info("Unchecking contact sharing and editing phone", { phone });
  const parts = phone.split(/\s+/);
  if (parts.length !== 3) throw new Error(`Phone must be "countryCode areaCode number" (3 space-separated parts), got: "${phone}"`);
  await Checkout.uncheckContactSharingAndEditPhone(this.page, parts[0], parts[1], parts[2]);
});

When("I edit the contact email to {string}", async function (email) {
  logger.info("Editing contact email", { email });
  await Checkout.editContactEmail(this.page, email);
});

Then("{string} should be displayed in the checkout page", async function (expectedText) {
  logger.info("Verifying text is displayed in checkout page", { expectedText });
  await this.page.locator(`text=${expectedText}`).first().waitFor({ state: 'visible', timeout: 15000 });
});

Then("the contact email on checkout should contain {string}", async function (expectedText) {
  logger.info("Verifying contact email contains expected text", { expectedText });
  await Checkout.verifyContactEmailContains(this.page, expectedText);
});

Then("the contact telephone on checkout should contain numbers", async function () {
  logger.info("Verifying contact telephone on checkout contains numeric values");
  await Checkout.verifyContactPhoneContainsNumbers(this.page);
});

Then("the booker notification phone on checkout should contain numbers", async function () {
  logger.info("Verifying booker notification phone on checkout contains numeric values");
  await Checkout.verifyBookerNotificationPhoneContainsNumbers(this.page);
});
