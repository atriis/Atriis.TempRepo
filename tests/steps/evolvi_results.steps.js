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

// ===== TODO STUBS — need DSL/Page implementation =====

When("I close mandatory notifications if displayed", async function () {
  throw new Error("TODO: implement 'I close mandatory notifications if displayed' — close mandatory notification modal when it appears on search/results");
});

Then("the Select outbound prompt should be displayed", async function () {
  throw new Error("TODO: implement 'the Select outbound prompt should be displayed' — assert outbound prompt text is shown before selecting first leg");
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

When("I select a Split Ticket result", async function () {
  throw new Error("TODO: implement 'I select a Split Ticket result' — select a result marked as SplitTix/Anytime Return according to scenario data");
});

Then("split ticket information should be visible in cart before checkout", async function () {
  throw new Error("TODO: implement 'split ticket information should be visible in cart before checkout' — validate split ticket labels/details are visible in cart pre-checkout");
});

Then("split ticket information should be visible after checkout and in itinerary email", async function () {
  throw new Error("TODO: implement 'split ticket information should be visible after checkout and in itinerary email' — validate split ticket details in post-booking/cart and itinerary email preview");
});

Then("itinerary email split ticket information should match the trip", async function () {
  throw new Error("TODO: implement 'itinerary email split ticket information should match the trip' — compare itinerary email split-ticket details with trip data");
});

Then("the Evolvi no-results helper message should be displayed", async function () {
  throw new Error("TODO: implement 'the Evolvi no-results helper message should be displayed' — assert helper text guiding user to modify filter criteria");
});

Then("the Evolvi no results title should be displayed", async function () {
  throw new Error("TODO: implement 'the Evolvi no results title should be displayed' — assert no-results title/header is shown");
});

Then("the Evolvi expiry tooltip should show at least {int} minutes", async function (minutes) {
  throw new Error(`TODO: implement 'the Evolvi expiry tooltip should show at least ${minutes} minutes' — read expiry tooltip and assert the displayed value is >= ${minutes}`);
});

Then("the FOP owner should be displayed as Paid by TMC", async function () {
  throw new Error("TODO: implement 'the FOP owner should be displayed as Paid by TMC' — assert FOP owner label text in cart payment section");
});

Then("the CVV field should not be displayed for invoice FOP", async function () {
  throw new Error("TODO: implement 'the CVV field should not be displayed for invoice FOP' — assert CVV input is hidden when invoice FOP is configured");
});
