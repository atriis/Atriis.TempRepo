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
