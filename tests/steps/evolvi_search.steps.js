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

// Fills the round-trip form and stops there, for the scenarios that assert on the search form
// itself. Expects "I select UK Rail in the search form" to have run first, and leaves the split
// ticket checkbox at its app default rather than forcing it either way.
When("I fill in a round trip Evolvi train from {string} without clicking search button", async function (routeKey) {
  logger.info("Filling the round trip Evolvi search form without submitting it", { routeKey });
  await EvolviSearch.fillEvolviRoundTripWithoutSearching(this.page, routeKey);
});

// Not the generic "I click the search button": that clicks once, and a UK Rail round-trip Search
// click is silently swallowed while the form is still revalidating, leaving the run on a filled-in
// form that never submitted. This one confirms the form actually left the screen.
When("I click the UK Rail search button", async function () {
  logger.info("Submitting the UK Rail search form");
  const { attempts } = await EvolviSearch.submitEvolviSearch(this.page);
  logger.info("The UK Rail search was submitted", { attempts });
});

// ===== SPLIT TICKET (SplitTix) =====

// The counterpart of "I search for a one way Evolvi train from {string}", which unchecks
// "Request Split Ticket" before searching. This one leaves it on so the results come back with
// SplitTix fares, and it does not re-select the UK Rail product — the split-ticket scenarios have
// already selected it and configured Advanced search by the time they search.
When("I search one way Evolvi train from {string} without unchecking split ticket checkbox", async function (routeKey) {
  logger.info("Searching for one-way Evolvi train with split ticket requested", { routeKey });
  await EvolviSearch.searchEvolviOneWayWithSplitTicket(this.page, routeKey);
});

When("I validate that split ticket options in Evolvi search checkbox is checked", async function () {
  logger.info("Verifying the Evolvi split ticket option is offered and pre-checked");
  await EvolviSearch.expectSplitTicketCheckboxIsChecked(this.page);
});

Then("I hover over split ticket info to see the message {string}", async function (expectedMessage) {
  logger.info("Hovering the Evolvi split ticket info tooltip", { expectedMessage });
  await EvolviSearch.expectSplitTicketInfoTooltipMessage(this.page, expectedMessage);
});

Then("I should select {string} radio button", async function (label) {
  logger.info("Selecting the Evolvi split type radio button", { label });
  await EvolviSearch.selectSplitTicketType(this.page, label);
});

// The split-type tooltip documents both split types at once, so both of this scenario's message
// checks read the same tooltip — the radio label in the phrase names where the icon sits, not which
// half of the tooltip is asserted.
Then("I hover over split ticket info from {string} to see message {string}", async function (radioLabel, expectedMessage) {
  logger.info("Hovering the Evolvi split type info tooltip", { radioLabel, expectedMessage });
  await EvolviSearch.expectSplitTicketTypeTooltipMessage(this.page, expectedMessage);
});

Then("I also see message {string} when hover over split ticket info from {string}", async function (expectedMessage, radioLabel) {
  logger.info("Re-reading the Evolvi split type info tooltip", { radioLabel, expectedMessage });
  await EvolviSearch.expectSplitTicketTypeTooltipMessage(this.page, expectedMessage);
});

// ===== TODO STUBS — need DSL/Page implementation =====

When("I search Evolvi with NCL location", async function () {
  throw new Error("TODO: implement 'I search Evolvi with NCL location' — perform one-way Evolvi search using NCL location and TOD-specific setup");
});

// ===== THEN STEPS =====

Then("the {string} checkbox should be displayed and checked", async function (label) {
  logger.info("Verifying a UK Rail search checkbox is displayed and pre-checked", { label });
  await EvolviSearch.expectSearchCheckboxIsDisplayedAndChecked(this.page, label);
});

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
