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

// Traveler {int} is 1-based in Gherkin; converted to a 0-based row index at the step, same
// convention as "I select railcard {string} for traveler {int} at search".
When("I assign railcard {string} to traveler {int} in the Railcard Assignment extra", async function (railcardOption, travelerNumber) {
  logger.info("Assigning railcard in Railcard Assignment extra", { railcardOption, travelerNumber });
  await EvolviResults.assignRailcardInExtra(this.page, travelerNumber - 1, railcardOption);
});

// No page/DSL action needed — the row's select is clearable with no default, so an untouched row
// is already "no railcard assigned". Kept as an explicit step for Gherkin readability.
When("I leave traveler {int} without a railcard in the Railcard Assignment extra", async function (travelerNumber) {
  logger.info("Leaving traveler without a railcard in Railcard Assignment extra", { travelerNumber });
});

When("I save the Railcard Assignment extra", async function () {
  logger.info("Saving Railcard Assignment extra");
  await EvolviResults.saveRailcardAssignmentExtra(this.page);
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

Then("I should see outbound text in Evolvi results page", async function () {
  logger.info("Verifying the outbound heading is displayed on the Evolvi results page");
  await EvolviResults.expectDirectionHeadingDisplayed(this.page, "outbound");
});

// The Evolvi-scoped counterpart of the generic "I should see the heading {string}": it takes the
// expected wording so it works with the application in any language, reads only the outbound
// .stations-container heading (a bare h3 in that section is a departure time), and allows the time
// an Evolvi round-trip search really takes — the generic step gives up at 30s, while the results
// grid is still on its "Removing duplicates" skeleton.
Then("the Evolvi outbound results heading should read {string}", async function (expectedHeading) {
  logger.info("Verifying the Evolvi outbound results heading", { expectedHeading });
  await EvolviResults.expectDirectionHeadingText(this.page, "outbound", expectedHeading);
});

// ===== Results-returned check (test 66082) =====
//
// "Results were returned" is read off the "Earlier"/"Later" controls in each direction's results
// header rather than off a card count: uk-rail-results.vue renders that pair inside the same
// .data-section as the direction's journeys, so they are present exactly when there is a window of
// trains to page through. One phrase covers both legs because a round trip that returned only one
// of them has not returned results.
Then("I should see the Evolvi round trip results page returned train results", async function () {
  logger.info("Verifying the Evolvi round trip results page returned train results for both legs");
  await EvolviResults.expectRoundTripResultsReturned(this.page);
});

// ===== Fare-type row order (AB#84258) =====
//
// Rows are sorted by each fare type's lowest outbound price; the departure-time columns are not.
// The sort check covers blank cells, Anytime Return prices and ties in one read of the grid, since
// which of those occur depends on the supplier's live inventory.

When("I navigate back to Evolvi search via breadcrumb", async function () {
  logger.info("Navigating back to the Evolvi search via the results breadcrumb");
  await EvolviResults.navigateBackToSearchViaBreadcrumb(this.page);
});

Then("the Evolvi fare type rows should be sorted by lowest outbound price", async function () {
  logger.info("Verifying the Evolvi fare-type rows are sorted by lowest outbound price");
  await EvolviResults.expectFareGroupsSortedByLowestOutboundPrice(this.page);
});

Then("the Evolvi {word} departure times should be in chronological order", async function (direction) {
  logger.info("Verifying the Evolvi journey departure times are chronological", { direction });
  await EvolviResults.expectJourneyDepartureTimesChronological(this.page, direction);
});

Then("every Evolvi fare type row should show its outbound and inbound prices side by side", async function () {
  logger.info("Verifying every Evolvi fare-type row carries both legs of the round trip");
  await EvolviResults.expectFareGroupsCarryBothDirections(this.page);
});

// ===== Search-criteria check on the results grid (test 49309) =====
//
// One phrase covers both legs because the manual test states them together, and because the check
// only means anything as a pair: each direction is searched for its own time (the UK Rail form
// defaults to 07:00 out / 16:00 back), so a grid that honours one and not the other is still wrong.

Then(
  "outbound times start at {string} and inbound times start at {string}",
  async function (outboundTime, inboundTime) {
    logger.info("Verifying the Evolvi journey grid starts at the times searched", {
      outboundTime,
      inboundTime,
    });
    await EvolviResults.expectJourneyTimesStartAt(this.page, "outbound", outboundTime);
    await EvolviResults.expectJourneyTimesStartAt(this.page, "inbound", inboundTime);
  },
);

// ===== Travel-together (GroupSave) discount =====

Then("discount banner is displayed in at least one of the fares", async function () {
  logger.info("Verifying at least one Evolvi fare is priced as a travel-together discount");
  await EvolviResults.expectTravelTogetherDiscountDisplayed(this.page);
});



