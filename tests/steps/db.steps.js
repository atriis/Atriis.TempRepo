require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { DbRail } = require("@dsl");
const logger = require("@utils/logger").child("DbSteps");

setDefaultTimeout(120000);

When("I open the Deutsche Bahn continue action from trip overview", async function () {
  logger.info("Opening Deutsche Bahn continue action from trip overview");
  await DbRail.openContinueActionFromTripOverview(this.page);
});

Then("I should see the DB continue booking information message", async function () {
  logger.info("Validating DB continue booking information message");
  await DbRail.verifyContinueBookingInfoMessage(this.page);
});

When("I continue and confirm the DB order retrieval", async function () {
  logger.info("Continuing and confirming DB order retrieval");
  await DbRail.continueAndConfirmOrderRetrieval(this.page);
});

Then("I should see the DB order not completed error message", async function () {
  logger.info("Validating DB order not completed error message");
  await DbRail.verifyOrderNotCompletedErrorMessage(this.page);
});
