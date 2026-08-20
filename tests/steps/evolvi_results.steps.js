require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { EvolviResults } = require("@dsl");
const logger = require("@utils/logger").child("EvolviResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add an Evolvi one way to the trip", async function () {
  logger.info("Adding Evolvi one-way to trip");
  await EvolviResults.addEvolviOneWayToTrip(this.page);
});

When("I add an Evolvi round trip to the trip", async function () {
  logger.info("Adding Evolvi round trip to trip");
  await EvolviResults.addEvolviRoundtripToTrip(this.page);
});

// ===== ROUND TRIP LEG SELECTION (test 34400) =====
//
// Where each leg's resolved journey is parked on the Cucumber World, so the selection step picks
// its fare from the same journey column the departure hour was read from, and the assertion step
// compares against that recorded hour.
function storeExtractedJourney(world, direction, journey) {
  world.evolviExtractedJourneys = world.evolviExtractedJourneys || {};
  world.evolviExtractedJourneys[direction] = journey;
}

function readExtractedJourney(world, direction, extractionStepPhrase) {
  const journey = (world.evolviExtractedJourneys || {})[direction];
  if (!journey) {
    throw new Error(
      `[evolvi_results.steps] Missing the extracted ${direction} journey — expected ` +
      `'${extractionStepPhrase}' to have run first`,
    );
  }
  return journey;
}

function verifySelectedJourneySummary(summary, extractedJourney, direction) {
  if (!summary.raw.includes(summary.label)) {
    throw new Error(
      `[evolvi_results.steps] Expected the ${direction} summary at the top of the Evolvi results to be labelled ` +
      `"${summary.label}", but it reads: "${summary.raw}"`,
    );
  }
  if (summary.departureHour !== extractedJourney.departureHour) {
    throw new Error(
      `[evolvi_results.steps] Expected the ${direction} summary at the top of the Evolvi results to show the ` +
      `departure hour of the selected journey ("${extractedJourney.departureHour}"), but it shows ` +
      `"${summary.departureHour}" (full summary: "${summary.raw}")`,
    );
  }
}

When("I extract the first outbound departure hour available", async function () {
  logger.info("Extracting the first available Evolvi outbound departure hour");
  const journey = await EvolviResults.extractFirstAvailableDepartureHour(this.page, "outbound");
  logger.info("Stored the Evolvi outbound journey", journey);
  storeExtractedJourney(this, "outbound", journey);
});

When("I select the outbound first price available", async function () {
  const { columnIndex } = readExtractedJourney(this, "outbound", "I extract the first outbound departure hour available");
  logger.info("Selecting the first available Evolvi outbound fare", { columnIndex });
  await EvolviResults.selectFirstAvailablePrice(this.page, "outbound", columnIndex);
});

Then("outbound is displayed on top of the page with the same extracted outbound departure hour", async function () {
  const extractedJourney = readExtractedJourney(this, "outbound", "I extract the first outbound departure hour available");
  const summary = await EvolviResults.readSelectedJourneySummary(this.page, "outbound");
  logger.info("Verifying the Evolvi outbound summary matches the extracted departure hour", {
    extractedDepartureHour: extractedJourney.departureHour,
    summary: summary.raw,
  });
  verifySelectedJourneySummary(summary, extractedJourney, "outbound");
});

When("I extract the first inbound departure hour available", async function () {
  logger.info("Extracting the first available Evolvi inbound departure hour");
  const journey = await EvolviResults.extractFirstAvailableDepartureHour(this.page, "inbound");
  logger.info("Stored the Evolvi inbound journey", journey);
  storeExtractedJourney(this, "inbound", journey);
});

When("I select the inbound first price available", async function () {
  const { columnIndex } = readExtractedJourney(this, "inbound", "I extract the first inbound departure hour available");
  logger.info("Selecting the first available Evolvi inbound fare", { columnIndex });
  await EvolviResults.selectFirstAvailablePrice(this.page, "inbound", columnIndex);
});

Then("inbound is displayed on top of the page with the same extracted inbound departure hour", async function () {
  const extractedJourney = readExtractedJourney(this, "inbound", "I extract the first inbound departure hour available");
  const summary = await EvolviResults.readSelectedJourneySummary(this.page, "inbound");
  logger.info("Verifying the Evolvi inbound summary matches the extracted departure hour", {
    extractedDepartureHour: extractedJourney.departureHour,
    summary: summary.raw,
  });
  verifySelectedJourneySummary(summary, extractedJourney, "inbound");
});

// ===== SPLIT TICKET (SplitTix) =====

When("I should click info icon next to {string}", async function (groupTitle) {
  logger.info("Opening the SplitTix info dialog from the results", { groupTitle });
  await EvolviResults.openSplitTicketInfoDialog(this.page, groupTitle);
});

Then("I should see message should contain {string}", async function (expectedMessage) {
  logger.info("Verifying the SplitTix info dialog message and closing it", { expectedMessage });
  await EvolviResults.expectSplitTicketInfoDialogMessageAndClose(this.page, expectedMessage);
});

When("I hover over the first split ticket fare highlighted in blue", async function () {
  logger.info("Hovering the first blue-highlighted SplitTix fare");
  await EvolviResults.hoverFirstBlueSplitTicketFare(this.page);
});

Then("I should see message {string} for the first split ticket fare highlighted in blue", async function (expectedMessage) {
  logger.info("Verifying the SplitTix fare tooltip message", { expectedMessage });
  await EvolviResults.expectBlueSplitTicketFareTooltipContains(this.page, expectedMessage);
});

Then("I should see that first split ticket fare highlighted in blue message contaings {string}", async function (expectedText) {
  logger.info("Verifying the SplitTix fare tooltip saving line", { expectedText });
  await EvolviResults.expectBlueSplitTicketFareTooltipContains(this.page, expectedText);
});

When("I select and add to cart the first split ticket fare highlighted in blue", async function () {
  logger.info("Selecting the first blue-highlighted SplitTix fare and adding it to the trip");
  await EvolviResults.selectAndAddFirstBlueSplitTicketFareToTrip(this.page);
});

// ===== TODO STUBS — need DSL/Page implementation =====

Then("I should see outbound text in Evolvi results page", async function () {
  logger.info("Verifying the outbound heading is displayed on the Evolvi results page");
  await EvolviResults.expectDirectionHeadingDisplayed(this.page, "outbound");
});

When("I select an outbound Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select an outbound Evolvi fare' — click an outbound fare amount on results");
});

When("I select the highlighted inbound Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select the highlighted inbound Evolvi fare' — select the focused inbound fare option after outbound selection");
});

Then("the inbound selection should display the selected return time", async function () {
  throw new Error("TODO: implement 'the inbound selection should display the selected return time' — compare stored outbound/inbound time markers and validate displayed inbound summary");
});

When("I select a random available Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select a random available Evolvi fare' — select the first or random visible fare in Evolvi results");
});

When("I select the first available Evolvi fare", async function () {
  throw new Error("TODO: implement 'I select the first available Evolvi fare' — select the first available fare option in Evolvi results");
});

Then("the cart status should be Pending booking", async function () {
  throw new Error("TODO: implement 'the cart status should be Pending booking' — assert Pending booking badge/label in cart");
});

Then("the departure city should be correct in the Evolvi TOD section", async function () {
  throw new Error("TODO: implement 'the departure city should be correct in the Evolvi TOD section' — validate departure city text in delivery method (TOD) section");
});

Then("the FOP owner should be displayed as Paid by TMC", async function () {
  throw new Error("TODO: implement 'the FOP owner should be displayed as Paid by TMC' — assert FOP owner label text in cart payment section");
});

Then("the CVV field should not be displayed for invoice FOP", async function () {
  throw new Error("TODO: implement 'the CVV field should not be displayed for invoice FOP' — assert CVV input is hidden when invoice FOP is configured");
});
