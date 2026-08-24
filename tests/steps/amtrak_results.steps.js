require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { getPageObject } = require("@utils/pageObjectCache");
const AmtrakResultsPage = require("@pages/AmtrakResultsPage");
const { AmtrakResults } = require("@dsl");
const logger = require("@utils/logger").child("AmtrakResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add an Amtrak one way to the trip", async function () {
  logger.info("Adding an Amtrak one-way result to the trip");
  await AmtrakResults.addAmtrakOneWayToTrip(this.page);
});

When("I click more details for the first Amtrak result", async function () {
  logger.info("Clicking more details for first Amtrak result");
  const amtrakResultsPage = getPageObject(this.page, AmtrakResultsPage);
  await amtrakResultsPage.clickMoreDetailsButton();
});

// ===== TODO STUBS — converted from Testim (need DSL/Page implementation) =====

When("I check fare rules and add the Amtrak round trip to cart", async function () {
  throw new Error("TODO: Implement checking fare rules for outbound (Cancellations, Changes, Supplier T&C) and return results, selecting 6th result and adding to cart. See Amtrak_results___Check_fare_rules_and_add_to_trip() in Testim source.");
});

When("I share the price offer from the Amtrak results page", async function () {
  throw new Error("TODO: Implement clicking share icon in results, selecting trains for both city pairs, opening email panel, verifying Train Offer email content, and sending. See Share_q_from_results() in Testim source.");
});

When("I close the Amtrak results share panel", async function () {
  throw new Error("TODO: Implement clicking '.share-bar .is-clickable' to close the share panel in Amtrak results.");
});

When("I view fare rules for the first Amtrak result", async function () {
  throw new Error("TODO: Implement clicking '.amtrak-list > :nth-child(1) .no-padding' to open fare rules for the first result in the Amtrak results list.");
});

When("I close the Amtrak fare rules modal", async function () {
  throw new Error("TODO: Implement clicking the SVG close button on the Amtrak fare rules modal in results page.");
});

When("I expand the first Amtrak result details", async function () {
  throw new Error("TODO: Implement clicking '.amtrak-list > :nth-child(1) [hassabreresults=true]' to expand the first Amtrak result details panel.");
});

When("I verify the out of policy indicator in the first Amtrak result details", async function () {
  throw new Error("TODO: Implement expanding first result details, clicking first class radio button, verifying shield icon is visible inside the details panel, and closing overlay. See OOP_is_displayed_in_results() in Testim source.");
});

When("I add the out of policy Amtrak result to cart", async function () {
  throw new Error("TODO: Implement selecting first Amtrak result, waiting for OOP badge ('.app-out-of-policy'), hovering info icon, verifying 'Upgrade cost is greater than 5 USD' tooltip, and clicking add to trip. See Add_Amtrak_one_way_from_search_results_to_cart() in Testim source.");
});

// ===== THEN STUBS =====

Then("the fare rules modal should show the supplier terms and conditions link", async function () {
  throw new Error("TODO: Implement verifying the Supplier Terms & Conditions link (target='_blank') is visible in the Amtrak fare rules modal.");
});

Then("the available classes and fares should be displayed", async function () {
  throw new Error("TODO: Implement verifying '.classes-card .mb-4' contains 'Available Classes And Fares' text after expanding an Amtrak result.");
});

