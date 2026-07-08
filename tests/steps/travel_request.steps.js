require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { TravelRequest } = require("@dsl");
const logger = require("@utils/logger").child("TravelRequest");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I send a flight travel request from {string} to {string}", async function (from, to) {
  logger.info("Sending a flight travel request", { from, to });
  await TravelRequest.sendFlightTravelRequest(this.page, from, to);
});

When("I navigate to the trip from the travel request", async function () {
  logger.info("Navigating to trip from travel request success screen");
  await TravelRequest.navigateToTravelRequestTrip(this.page);
});

// ===== THEN STEPS =====

Then("the {string} confirmation should be displayed", async function (expectedText) {
  logger.info("Verifying travel request confirmation message", { expectedText });
  if (expectedText === "Sent to agent") {
    await TravelRequest.verifySentToAgent(this.page);
  } else {
    await this.page.getByText(expectedText).first().waitFor({ state: "visible", timeout: 30000 });
  }
});

Then("the travel requested items should be visible in the trip", async function () {
  logger.info("Verifying requested items are visible in the trip view");
  await TravelRequest.verifyRequestedItemsVisible(this.page);
});

Then(
  "the travel requested item should be visible in the trip with the title containing {string} text",
  async function (text) {
    logger.info("Verifying travel requested item title contains text", { text });
    await TravelRequest.verifyRequestedItemTitleContains(this.page, text);
  }
);

When("I navigate to the trip cart", async function () {
  logger.info("Navigating to trip cart via shopping cart icon");
  await TravelRequest.navigateToTripCart(this.page);
});
