require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { FlightResults } = require("../../src/dsl");
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

Then("the outbound leg brand cards are displayed", async function () {
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

Then("the fares with {string} should show {string} in pricing options", async function (fareName, expectedText) {
  logger.info("[NewFlightFlow] Verifying brand card feature text", { fareName, expectedText });
  const result = await FlightResults.verifyFareShowsFeatureInBrandCard(this.page, fareName, expectedText);
  logger.info("[NewFlightFlow] Brand card feature text verified", result);
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
