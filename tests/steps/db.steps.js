require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const logger = require("@utils/logger").child("DbSteps");

setDefaultTimeout(120000);

When("I open the traveler profile frequent programs tab", async function () {
  logger.info("Opening traveler profile frequent programs tab");
  throw new Error("TODO: implement 'I open the traveler profile frequent programs tab' for Deutsche Bahn frequent programs profile flow");
});

When("I add DB BahnCard 50 with number and expiration date", async function () {
  logger.info("Adding DB BahnCard 50 with expiration date");
  throw new Error("TODO: implement 'I add DB BahnCard 50 with number and expiration date' including save action");
});

Then("the DB BahnCard 50 expiration date should be saved", async function () {
  logger.info("Validating DB BahnCard 50 expiration date save");
  throw new Error("TODO: implement 'the DB BahnCard 50 expiration date should be saved' by asserting saved date value");
});

When("I remove the DB BahnCard frequent program entry", async function () {
  logger.info("Removing DB BahnCard frequent program entry");
  throw new Error("TODO: implement 'I remove the DB BahnCard frequent program entry' and confirm deletion dialog");
});

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
