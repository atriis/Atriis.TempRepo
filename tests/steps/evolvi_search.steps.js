require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { EvolviSearch } = require("@dsl");
const logger = require("@utils/logger").child("EvolviSearch");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for a one way Evolvi train from {string}", async function (routeKey) {
  logger.info("Searching for one-way Evolvi train", { routeKey });
  await EvolviSearch.searchEvolviOneWay(this.page, routeKey);
});

When("I search for a round trip Evolvi train from {string}", async function (routeKey) {
  logger.info("Searching for round trip Evolvi train", { routeKey });
  await EvolviSearch.searchEvolviRoundTrip(this.page, routeKey);
});

// ===== TODO STUBS — need DSL/Page implementation =====

When("I select UK Rail in the search form", async function () {
  throw new Error("TODO: implement 'I select UK Rail in the search form' — open product dropdown and choose UK Rail/Evolvi option");
});

When("I validate and configure split ticket options in Evolvi search", async function () {
  throw new Error("TODO: implement 'I validate and configure split ticket options in Evolvi search' — validate split-ticket controls and configure split-ticket radio options");
});

When("I perform the Evolvi split ticket search", async function () {
  throw new Error("TODO: implement 'I perform the Evolvi split ticket search' — fill route/date values for split-ticket scenario and search");
});

When("I search Evolvi with NCL location", async function () {
  throw new Error("TODO: implement 'I search Evolvi with NCL location' — perform one-way Evolvi search using NCL location and TOD-specific setup");
});

When("I select Evolvi in the search product selector", async function () {
  throw new Error("TODO: implement 'I select Evolvi in the search product selector' — select Evolvi product from the search page dropdown");
});

Then("the single traveler-only option should not be displayed in Evolvi search", async function () {
  throw new Error("TODO: implement 'the single traveler-only option should not be displayed in Evolvi search' — assert no traveler-selection option limiting to 1 traveler is shown in multipax mode");
});
