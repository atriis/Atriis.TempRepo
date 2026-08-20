require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Cart, EvolviResults } = require("@dsl");
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

// ===== FARE RULES =====
//
// Evolvi opens its fare rules in the same "Full information" drawer everywhere, but the trigger
// differs: from results it is the fare tooltip's own button (EvolviResults), while the cart renders
// uk-rail-quote-card's "Fare rules" link (Cart) — hence the two different DSLs. The cart phrase also
// covers the post-booking check: the trip overview renders that very same quote card.

Then("the fare rules should be accessible in Evolvi results and contain {string}", async function (expectedText) {
  logger.info("Verifying Evolvi fare rules are accessible from results", { expectedText });
  await EvolviResults.verifyFareRulesFromFirstResultContainsText(this.page, expectedText);
});

Then("the fare rules should be accessible in the Evolvi cart and contain {string}", async function (expectedText) {
  logger.info("Verifying Evolvi fare rules are accessible in cart", { expectedText });
  await Cart.verifyUkRailFareRulesDrawerContainsText(this.page, expectedText);
});

// ===== Named fare groups (test 67004) =====
//
// Two phrases over one direction-parameterised DSL method, because the manual test names the leg in
// the step itself. The differing UI shapes behind them — a priced outbound cell vs an Anytime
// Return's "Select Time" inbound cell — are resolved inside that method.

When("I select the outbound {string} Evolvi fare", async function (groupTitle) {
  logger.info("Selecting the outbound Evolvi fare of a named fare group", { groupTitle });
  await EvolviResults.selectFareByGroupTitle(this.page, "outbound", groupTitle);
});

When("I select the inbound {string} Evolvi fare", async function (groupTitle) {
  logger.info("Selecting the inbound Evolvi fare of a named fare group", { groupTitle });
  await EvolviResults.selectFareByGroupTitle(this.page, "inbound", groupTitle);
});

// Adds what is already selected — it must not pick a fare of its own, or it would toggle one of the
// legs the two steps above chose back off.
When("I click Evolvi add to trip", async function () {
  logger.info("Adding the selected Evolvi fares to the trip");
  await EvolviResults.addSelectedFaresToTrip(this.page);
});

// ===== Greenest (lowest carbon) suggested fare (test 59032) =====

When("I hover over the greenest Evolvi fare in results", async function () {
  logger.info("Hovering the greenest suggested Evolvi fare in results");
  await EvolviResults.hoverGreenestSuggestedFare(this.page);
});

Then("the greenest fare tooltip should show {string}", async function (expectedMessage) {
  logger.info("Verifying the greenest Evolvi fare tooltip message", { expectedMessage });
  await EvolviResults.expectGreenestFareTooltipContains(this.page, expectedMessage);
});

When("I select the greenest Evolvi fare", async function () {
  logger.info("Selecting the greenest suggested Evolvi fare");
  await EvolviResults.selectGreenestFare(this.page);
});

// Parked on the shared World array the generic "the cart total price should match the last
// extracted price" assertion reads (cart.steps.js), so no rail-specific comparison step is needed.
When("I extract the selected fare total price from the Evolvi results header", async function () {
  logger.info("Extracting the selected fare total price from the Evolvi results header");
  const price = await EvolviResults.extractSelectedFareTotalPrice(this.page);

  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);

  logger.info("Extracted selected Evolvi fare total price", { price });
});

// ===== Journey "More Details" (test 66963) =====
//
// The phrase says "hover", which is how the manual test describes reaching for the glyph, but the
// results grid opens the dialog from the @click on the whole .route-desc block — so the DSL clicks
// it. Kept verbatim because that is how the test case spells the step.

Then("the first Evolvi outbound time should be marked as {string}", async function (expectedLabel) {
  logger.info("Verifying the first Evolvi outbound journey's stops label", { expectedLabel });
  await EvolviResults.expectJourneyStopsLabel(this.page, "outbound", 0, expectedLabel);
});

When("I hover over first Evolvi outbound time information icon", async function () {
  logger.info("Opening the More Details dialog of the first Evolvi outbound journey");
  await EvolviResults.openJourneyDetails(this.page, "outbound", 0);
});

Then(
  "the journey details should show the departure station {string} and the arrival station {string}",
  async function (departureStation, arrivalStation) {
    logger.info("Verifying the journey details departure and arrival stations", {
      departureStation,
      arrivalStation,
    });
    await EvolviResults.expectJourneyDetailsStations(this.page, departureStation, arrivalStation);
  },
);

Then("the journey details travel mode should be {string}", async function (expectedMode) {
  logger.info("Verifying the journey details travel mode", { expectedMode });
  await EvolviResults.expectJourneyDetailsTravelMode(this.page, expectedMode);
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
