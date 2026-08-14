require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { EvolviSearch } = require("@dsl");
const logger = require("@utils/logger").child("EvolviSearch");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

// Selects the UK Rail (Evolvi) product in the search form without searching — for scenarios that
// interact with the search form itself (travellers, split ticket) before submitting it.
When("I select UK Rail in the search form", async function () {
  logger.info("Selecting UK Rail in the search form");
  await EvolviSearch.selectEvolviSearch(this.page);
});

When("I search for a one way Evolvi train from {string}", async function (routeKey) {
  logger.info("Searching for one-way Evolvi train", { routeKey });
  await EvolviSearch.searchEvolviOneWay(this.page, routeKey);
});

When("I search for a round trip Evolvi train from {string}", async function (routeKey) {
  logger.info("Searching for round trip Evolvi train", { routeKey });
  await EvolviSearch.searchEvolviRoundTrip(this.page, routeKey);
});

// ===== TODO STUBS — need DSL/Page implementation =====

When("I validate and configure split ticket options in Evolvi search", async function () {
  throw new Error("TODO: implement 'I validate and configure split ticket options in Evolvi search' — validate split-ticket controls and configure split-ticket radio options");
});

When("I perform the Evolvi split ticket search", async function () {
  throw new Error("TODO: implement 'I perform the Evolvi split ticket search' — fill route/date values for split-ticket scenario and search");
});

When("I search Evolvi with NCL location", async function () {
  throw new Error("TODO: implement 'I search Evolvi with NCL location' — perform one-way Evolvi search using NCL location and TOD-specific setup");
});

// ===== THEN STEPS =====

Then("the single traveler-only option should not be displayed in Evolvi search", async function () {
  logger.info("Verifying the Evolvi traveller-count select offers no single-traveller option");

  const { travelerCount, optionLabels, offeredCounts } =
    await EvolviSearch.readTravelersCountOptions(this.page);

  expect(
    travelerCount,
    "This scenario needs a multipax trip — expected more than one traveller in the Evolvi search form.",
  ).toBeGreaterThan(1);

  // travelersCountOptions starts at passengers.length, so the lowest option offered must be the
  // number of travellers added. Asserting the lowest covers the 46785 regression outright: any
  // single-traveller option, which let the search drop back to one passenger, would pull it to 1.
  expect(
    Math.min(...offeredCounts),
    `The Evolvi traveller-count select should offer no option below the ${travelerCount} travellers ` +
      `added — a single-traveller option must not be present. Options shown: ${JSON.stringify(optionLabels)}`,
  ).toBe(travelerCount);
});
