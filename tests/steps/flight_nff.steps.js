require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { FlightResults } = require("../../src/dsl");
const config = require("@config/config");
const logger = require("@utils/logger").child("FlightNFF");

setDefaultTimeout(120000);

// ===== NEW FLIGHT FLOW STEPS =====

When("I select the first flight result in new flight flow", async function () {
  logger.info("[NewFlightFlow] Clicking Select Flight button to enter brand cards view");
  await FlightResults.selectFirstFlightResultNFF(this.page);
});

// Selects the first result that is a separated-ticket itinerary (the first card with the
// "Separated Tickets" tag) — the first result overall may be a single ticket.
When("I select the first flight result with separated tickets in new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting the first separated-ticket flight result");
  await FlightResults.selectFirstSeparatedTicketFlightResultNFF(this.page);
});

When("I select the outbound first option from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting first outbound brand card");
  await FlightResults.selectOutboundFirstBrandCardNewFlightFlow(this.page);
});

When("I select the outbound brand card named {string} from pricing options new flight flow", async function (brandName) {
  logger.info("[NewFlightFlow] Selecting outbound brand card by name", { brandName });
  await FlightResults.selectOutboundBrandCardByNameNewFlightFlow(this.page, brandName);
});

When("I select the {word} brand card without checked baggage from pricing options new flight flow", async function (legName) {
  const legIndex = { outbound: 0, inbound: 1 }[legName];
  if (legIndex === undefined) throw new Error(`Unknown leg "${legName}" — expected "outbound" or "inbound"`);
  logger.info("[NewFlightFlow] Selecting brand card without checked baggage", { legName });
  const result = await FlightResults.selectBrandCardWithoutCheckedBaggageNewFlightFlow(this.page, legIndex);
  logger.info("[NewFlightFlow] Selected brand card without checked baggage", result);
});

When("I select the inbound first option from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting first inbound brand card");
  await FlightResults.selectInboundFirstBrandCardNewFlightFlow(this.page);
});

Then("I should see the inbound heading {string} in pricing options new flight flow", async function (expectedHeading) {
  logger.info("[NewFlightFlow] Verifying inbound heading", { expectedHeading });
  await FlightResults.verifyInboundHeadingNewFlightFlow(this.page, expectedHeading);
});

When("I add to cart from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Clicking add to cart from pricing options");
  await FlightResults.addToCartNewFlightFlow(this.page);
});

// ===== CLASSIC PRICING OPTIONS DRAWER (pricing-options.vue) =====
// The leg-by-leg "Select fare" drawer that renders for non-New-Flight-Flow
// accounts. Distinct from the NFF brand-card steps above — see FlightResults DSL.

When("I select the outbound first option from pricing options page", async function () {
  logger.info("[PricingOptions] Selecting first outbound fare from the classic pricing options drawer");
  await FlightResults.selectOutboundFirstOptionFromPricingOptions(this.page);
});

When("I select the inbound first option from pricing options page", async function () {
  logger.info("[PricingOptions] Selecting first inbound fare from the classic pricing options drawer");
  await FlightResults.selectInboundFirstOptionFromPricingOptions(this.page);
});

When("I add to cart from pricing options page", async function () {
  logger.info("[PricingOptions] Adding selected fares to cart from the classic pricing options drawer");
  await FlightResults.addToCartFromPricingOptions(this.page);
});

When("I select a random outbound fare from pricing options page", async function () {
  logger.info("[PricingOptions] Selecting a random outbound fare from the classic pricing options drawer");
  const result = await FlightResults.selectRandomFareFromPricingOptionsLeg(this.page, 0);
  logger.info("[PricingOptions] Random outbound fare selected", result);
});

When("I select a random inbound fare from pricing options page", async function () {
  logger.info("[PricingOptions] Selecting a random inbound fare from the classic pricing options drawer");
  const result = await FlightResults.selectRandomFareFromPricingOptionsLeg(this.page, 1);
  logger.info("[PricingOptions] Random inbound fare selected", result);
});

When("I wait for the outbound leg in pricing options page", async function () {
  logger.info("[PricingOptions] Waiting for the outbound leg of the classic pricing options drawer");
  await FlightResults.waitForPricingOptionsLeg(this.page, 0);
});

When("I wait for the inbound leg in pricing options page", async function () {
  logger.info("[PricingOptions] Waiting for the inbound leg of the classic pricing options drawer");
  await FlightResults.waitForPricingOptionsLeg(this.page, 1);
});

Then("the pricing options leg should offer more than one fare", async function () {
  logger.info("[PricingOptions] Verifying the current pricing options leg offers more than one fare");
  const result = await FlightResults.verifyPricingOptionsLegOffersMultipleFares(this.page);
  logger.info("[PricingOptions] Multiple fares verified on the current leg", result);
});

Then("every fare name in pricing options should match its fare family description", async function () {
  logger.info("[PricingOptions] Comparing fare names with the captured fare families");
  const result = await FlightResults.verifyBrandNamesMatchFareFamilyDescriptions(this.page, this, {
    flow: "pricingOptions",
  });
  logger.info("[PricingOptions] Fare names match the search reply", result);
});

// Payload steps, not UI ones: they read the trip's request log and take `world`, not
// `page`. They sit here because the scenarios using them drive the brand cards below, so the
// whole flow stays in one step file. See docs/PayloadValidation.md section 2.10.9.
When("I capture the fare families described in {string} from Storage", async function (requestType) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", {
      step: "captureFareFamilyDescriptions",
      requestType,
    });
    return;
  }
  logger.info("Capturing the fare families the search reply describes", {
    requestType,
    tripId: this.tripId || this.currentTripId || this.createdTripId || null,
  });
  const result = await FlightResults.captureFareFamilyDescriptions(this, requestType);
  logger.info("Fare families captured", { count: result.families.length });
});

Then(
  "the fare family descriptions should be batched in {string} requests of at most {int} per call",
  async function (requestType, maxPerCall) {
    if (!config.payloadValidation.enabled) {
      logger.warn("PAYLOAD_VALIDATION_ENABLED=false", {
        step: "expectFareFamilyDescriptionsBatched",
        requestType,
        maxPerCall,
      });
      return;
    }
    logger.info("Validating fare family descriptions were batched", {
      requestType,
      maxPerCall,
      tripId: this.tripId || this.currentTripId || this.createdTripId || null,
    });
    await FlightResults.expectFareFamilyDescriptionsBatched(this, requestType, maxPerCall);
  }
);

Then(
  "more than {int} fare families should have been described in {string} requests",
  async function (atLeast, requestType) {
    if (!config.payloadValidation.enabled) {
      logger.warn("PAYLOAD_VALIDATION_ENABLED=false", {
        step: "expectMoreFareFamiliesDescribedThan",
        requestType,
        atLeast,
      });
      return;
    }
    logger.info("Validating the itinerary offered a fare family ladder wider than the cap", {
      requestType,
      atLeast,
      tripId: this.tripId || this.currentTripId || this.createdTripId || null,
    });
    await FlightResults.expectMoreFareFamiliesDescribedThan(this, requestType, atLeast);
  }
);

// Payload steps: they read the trip's reprice log and take `world`, not `page`. The timeout clears
// the DSL's own 180s download budget - at the default 120s the step dies first and reports nothing.
const PAYLOAD_STEP_TIMEOUT_MS = 240000;

When("I capture the fare ladder priced for each leg in {string} from Storage", { timeout: PAYLOAD_STEP_TIMEOUT_MS }, async function (requestType) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "captureFareLaddersPerLeg", requestType });
    return;
  }
  logger.info("Capturing the fare ladder priced for each leg", {
    requestType,
    tripId: this.tripId || this.currentTripId || this.createdTripId || null,
  });
  const result = await FlightResults.captureFareLaddersPerLeg(this, requestType);
  logger.info("Fare ladders captured", { combinations: result.combinations });
});

Then("the fare ladder combinations should exceed {int}", async function (cap) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "expectFareLadderCombinationsExceed", cap });
    return;
  }
  logger.info("Validating the selection is wider than the combination cap", { cap });
  await FlightResults.expectFareLadderCombinationsExceed(this, cap);
});

Then("every priced fare should be reachable in some combination in {string}", { timeout: PAYLOAD_STEP_TIMEOUT_MS }, async function (requestType) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "expectEveryFareReachableInSomeOption", requestType });
    return;
  }
  logger.info("Validating no fare was lost when the combination matrix was capped", { requestType });
  const result = await FlightResults.expectEveryFareReachableInSomeOption(this, requestType);
  logger.info("Every priced fare is reachable", { rows: result.rows });
});

Then("the displayed leg {int} should offer a brand card for every fare in its ladder", async function (legNumber) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", { step: "verifyDisplayedLegBrandCardsMatchFareLadder", legNumber });
    return;
  }
  logger.info("[NewFlightFlow] Comparing the displayed leg's brand cards with the ladder its reprice priced", { legNumber });
  const result = await FlightResults.verifyDisplayedLegBrandCardsMatchFareLadder(this.page, this, legNumber - 1);
  logger.info("[NewFlightFlow] Displayed leg brand cards cover the ladder", result);
});

// Above the page's own 180s wait for the cards, so a slow render reports what the page object saw
// rather than a bare "function timed out".
const BRAND_CARDS_STEP_TIMEOUT_MS = 240000;

Then("the outbound leg brand cards are displayed", { timeout: BRAND_CARDS_STEP_TIMEOUT_MS }, async function () {
  logger.info("[NewFlightFlow] Verifying outbound leg brand cards are visible");
  const result = await FlightResults.verifyOutboundLegBrandCardsVisible(this.page);
  logger.info("[NewFlightFlow] Outbound brand cards visible", result);
});

Then('the outbound leg brand cards should display full price with "Starting from" label', async function () {
  logger.info('[NewFlightFlow] Verifying outbound leg brand cards show "Starting from" label');
  const result = await FlightResults.verifyOutboundLegShowsStartingFromPricing(this.page);
  logger.info("[NewFlightFlow] Outbound \"Starting from\" label verified", result);
});

Then("the inbound leg brand cards should display incremental price delta", async function () {
  logger.info("[NewFlightFlow] Verifying inbound leg brand cards show incremental price delta");
  const result = await FlightResults.verifyInboundLegShowsDeltaPricing(this.page);
  logger.info("[NewFlightFlow] Inbound price delta verified", result);
});

Then("the {string} cabin class tab should be displayed in flight selection", async function (cabinName) {
  logger.info("[NewFlightFlow] Verifying cabin class tab is displayed above the brand cards", { cabinName });
  const result = await FlightResults.verifyCabinClassTabDisplayedNewFlightFlow(this.page, cabinName);
  logger.info("[NewFlightFlow] Cabin class tab verified", result);
});

When("I select the {string} cabin class tab in flight selection", async function (cabinName) {
  logger.info("[NewFlightFlow] Selecting cabin class tab above the brand cards", { cabinName });
  const result = await FlightResults.selectCabinClassTabNewFlightFlow(this.page, cabinName);
  logger.info("[NewFlightFlow] Cabin class tab selected", result);
});

Then("every outbound leg brand card name should contain {string}", async function (expectedText) {
  logger.info("[NewFlightFlow] Verifying every outbound brand card name contains the expected text", { expectedText });
  const result = await FlightResults.verifyOutboundBrandCardNamesContain(this.page, expectedText);
  logger.info("[NewFlightFlow] Outbound brand card names verified", result);
});

Then(
  "every brand card name on the {string} leg should match its fare family description",
  async function (legName) {
    const legIndex = legName.toLowerCase() === "inbound" ? 1 : 0;
    logger.info("[NewFlightFlow] Comparing brand card names with the captured fare families", { legName });
    const result = await FlightResults.verifyBrandNamesMatchFareFamilyDescriptions(this.page, this, {
      flow: "newFlightFlow",
      legIndex,
    });
    logger.info("[NewFlightFlow] Brand card names match the search reply", result);
  }
);

Then("the inbound leg brand cards should be visible", async function () {
  logger.info("[NewFlightFlow] Verifying inbound leg brand cards are visible");
  const result = await FlightResults.verifyInboundLegBrandCardsVisible(this.page);
  logger.info("[NewFlightFlow] Inbound brand cards visible", result);
});

Then("the brand cards should display price without \"Starting from\" label", async function () {
  logger.info("[NewFlightFlow] Verifying brand cards show price without 'Starting from' label");
  const result = await FlightResults.verifyPriceWithoutStartingFromLabel(this.page);
  logger.info("[NewFlightFlow] Price-only display verified", result);
});

Then("the third leg brand cards should be visible", async function () {
  logger.info("[NewFlightFlow] Verifying third leg brand cards are visible");
  const result = await FlightResults.verifyThirdLegBrandCardsVisible(this.page);
  logger.info("[NewFlightFlow] Third leg brand cards visible", result);
});

Then("the third leg brand cards should display incremental price delta", async function () {
  logger.info("[NewFlightFlow] Verifying third leg brand cards show incremental price delta");
  const result = await FlightResults.verifyThirdLegShowsDeltaPricing(this.page);
  logger.info("[NewFlightFlow] Third leg price delta verified", result);
});

When("I select the third leg first option from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting first third leg brand card");
  await FlightResults.selectThirdLegFirstBrandCard(this.page);
});

Then("the separated tickets indication is displayed in pricing options view", async function () {
  logger.info("[NewFlightFlow] Verifying separated tickets indication is visible");
  const result = await FlightResults.verifySeparatedTicketsIndicationVisible(this.page);
  logger.info("[NewFlightFlow] Separated tickets indication visible", result);
});

Then("the brand cards should not display incremental price delta", async function () {
  logger.info("[NewFlightFlow] Verifying brand cards show no incremental price delta");
  const result = await FlightResults.verifyNoDeltaPricing(this.page);
  logger.info("[NewFlightFlow] No delta confirmed", result);
});

Then("the flight selection footer should display a total price per traveller", async function () {
  logger.info("[NewFlightFlow] Verifying footer shows total price per traveller");
  const result = await FlightResults.verifyFlightSelectionFooterTotalPerTraveller(this.page);
  logger.info("[NewFlightFlow] Footer total per traveller verified", result);
});

// Pushes onto this.extractedPrices, the array the shared cart-total assertions read from.
When("I extract the price per traveller from the flight selection footer", async function () {
  const price = await FlightResults.extractFlightSelectionFooterTotalPerTraveller(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  logger.info("[NewFlightFlow] Extracted footer price per traveller", {
    price,
    extractedPricesIndex: this.extractedPrices.length - 1,
  });
});

When("I select the outbound first non-agreement brand card from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting first outbound non-agreement brand card");
  await FlightResults.selectOutboundFirstNonAgreementBrandCard(this.page);
});

Then("the inbound leg brand cards should only display non-agreement fares", async function () {
  logger.info("[NewFlightFlow] Verifying inbound brand cards only show non-agreement fares");
  const { agreementCardIndices } = await FlightResults.getInboundLegAgreementCardIndices(this.page);
  expect(agreementCardIndices).toHaveLength(0);
  logger.info("[NewFlightFlow] Inbound non-agreement fares verified", { agreementCardIndices });
});

Then("at least one brand card on the {string} leg should display the Marine Fare icon", async function (legName) {
  const legIndex = legName.toLowerCase() === "inbound" ? 1 : 0;
  logger.info("[NewFlightFlow] Looking for a marine fare brand card across the carousel", { legName });
  const result = await FlightResults.verifyMarineFareIconVisibleInLegBrandCards(this.page, legIndex);
  logger.info("[NewFlightFlow] Marine fare brand card found", result);
});

Then("the fares with {string} should show {string} in pricing options", async function (fareName, expectedText) {
  logger.info("[NewFlightFlow] Verifying brand card feature text", { fareName, expectedText });
  const result = await FlightResults.verifyFareShowsFeatureInBrandCard(this.page, fareName, expectedText);
  logger.info("[NewFlightFlow] Brand card feature text verified", result);
});

// Stronger than the step above: asserts the feature row's green check icon as well as its text, so a
// fare that renders the same wording greyed out with a "close" icon fails instead of passing.
Then("{string} fare should have {string} text enabled with a green check mark", async function (fareName, expectedText) {
  logger.info("[NewFlightFlow] Verifying brand card feature is included with a green check mark", { fareName, expectedText });
  const result = await FlightResults.verifyFareShowsFeatureInBrandCard(this.page, fareName, expectedText, { requireGreenCheck: true });
  logger.info("[NewFlightFlow] Brand card feature verified as included", result);
});

When("I select outbound and inbound brands with different cancellation and change rules from pricing options new flight flow", { timeout: 300000 }, async function () {
  logger.info("[NewFlightFlow] Selecting outbound and inbound brands with different cancellation and change rules");
  await FlightResults.selectBrandsWithDifferentRulesAcrossLegs(this.page);
});

When("I select the inbound brand with same cancellation and change rules as outbound from pricing options new flight flow", async function () {
  logger.info("[NewFlightFlow] Selecting inbound brand with same cancellation and change rules as outbound");
  await FlightResults.selectInboundBrandMatchingOutboundRules(this.page);
});

Then("the change and cancellation rules warning is displayed with message {string}", async function (expectedMessage) {
  logger.info("[NewFlightFlow] Verifying change and cancellation rules warning is displayed", { expectedMessage });
  await FlightResults.verifyChangeAndCancellationRulesWarningVisible(this.page, expectedMessage);
});

Then("the change and cancellation rules warning is not displayed", async function () {
  logger.info("[NewFlightFlow] Verifying change and cancellation rules warning is not displayed");
  await FlightResults.verifyChangeAndCancellationRulesWarningNotVisible(this.page);
});

When("I start intercepting the flight pricing selection response", function () {
  logger.info("[NewFlightFlow] Starting FlightPricingSelection API response capture");
  this.flightPricingSelectionResponsePromise = FlightResults.startCapturingPricingSelectionResponse(this.page);
});

Then("the change and cancellation rules for each brand card leg should match that leg's fare rules in the intercepted pricing response", async function () {
  logger.info("[NewFlightFlow] Verifying per-leg change/cancellation rules match the intercepted FlightPricingSelection response");
  const result = await FlightResults.verifyPerLegFareRulesMatchPricingResponse(
    this.page,
    this.flightPricingSelectionResponsePromise
  );
  logger.info("[NewFlightFlow] Per-leg fare rules verified against response", {
    legsChecked: result.legsChecked,
    cardsChecked: result.cardsChecked,
  });
});

// ===== ADO Bug 84752 - Amadeus NDC change, cancellation and seat parsing =====

Then(
  "the brand card change and cancellation badges should match the penalties the airline filed",
  { timeout: 300000 },
  async function () {
    logger.info("[NewFlightFlow] Cross-checking brand card rules against the filed NDC penalties");
    const result = await FlightResults.verifyBrandCardRulesMatchNdcPenalties(this.page, this);
    logger.info("[NewFlightFlow] Brand card rules verified against the supplier payload", result);
  }
);

Then(
  "the brand card seat badge should match the seat service the airline granted",
  { timeout: 300000 },
  async function () {
    logger.info("[NewFlightFlow] Cross-checking brand card seat badge against the granted NDC seat service");
    const result = await FlightResults.verifyBrandCardSeatMatchesNdcServices(this.page, this);
    logger.info("[NewFlightFlow] Brand card seat badge verified against the supplier payload", result);
  }
);

Then(
  "the brand card checked baggage badge should match the allowance the airline bound to that leg",
  { timeout: 300000 },
  async function () {
    logger.info("[NewFlightFlow] Cross-checking brand card baggage against the bound NDC allowance");
    const result = await FlightResults.verifyBrandCardBaggageMatchesNdcAllowance(this.page, this);
    logger.info("[NewFlightFlow] Brand card baggage verified against the supplier payload", result);
  }
);

// ===== ADO Bug 85493 - Amadeus NDC brands dropped when the brand-details lookup failed =====

Then(
  "every brand the airline offered on the outbound leg should have a brand card with details",
  { timeout: 300000 },
  async function () {
    logger.info("[NewFlightFlow] Cross-checking the outbound brand cards against the brands the NDC offers carry");
    const result = await FlightResults.verifyEveryNdcOfferedBrandHasCardWithDetails(this.page, this);
    logger.info("[NewFlightFlow] Every offered outbound brand has a brand card", result);
  }
);
