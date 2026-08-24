require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const logger = require("@utils/logger").child("DbSteps");

setDefaultTimeout(120000);

When("I open the first trip from the trip list", async function () {
  logger.info("Opening first trip from trip list");
  throw new Error("TODO: implement 'I open the first trip from the trip list' from top navigation and trip list page");
});

When("I open the Deutsche Bahn continue action from trip overview", async function () {
  logger.info("Opening Deutsche Bahn continue action from trip overview");
  throw new Error("TODO: implement 'I open the Deutsche Bahn continue action from trip overview' via dropdown hover and click");
});

Then("I should see the DB continue booking information message", async function () {
  logger.info("Validating DB continue booking information message");
  throw new Error("TODO: implement 'I should see the DB continue booking information message'");
});

When("I continue and confirm the DB order retrieval", async function () {
  logger.info("Continuing and confirming DB order retrieval");
  throw new Error("TODO: implement 'I continue and confirm the DB order retrieval' by clicking continue and drawer confirmation button");
});

Then("I should see the DB order not completed error message", async function () {
  logger.info("Validating DB order not completed error message");
  throw new Error("TODO: implement 'I should see the DB order not completed error message'");
});
