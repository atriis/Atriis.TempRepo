require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { AmtrakResults, Cart } = require("@dsl");
const logger = require("@utils/logger").child("AmtrakResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add an Amtrak one way to the trip", async function () {
  logger.info("Adding an Amtrak one-way result to the trip");
  await AmtrakResults.addAmtrakOneWayToTrip(this.page);
});

When("I click more details for the first Amtrak result", async function () {
  logger.info("Clicking more details for first Amtrak result");
  await AmtrakResults.openMoreDetailsForFirstResult(this.page);
});

// Leaves the page in share mode; use the shared "I exit share mode" step to close the share bar.
When("I share the price offer from the Amtrak results page", async function () {
  logger.info("Sharing the Amtrak price offer from the results page");
  const { cityPairs } = await AmtrakResults.sharePriceOfferFromResults(this.page);
  logger.info("Amtrak price offer sent", { cityPairs });
});

When("I view fare rules for the first Amtrak result", async function () {
  logger.info("Opening fare rules for the first Amtrak result");
  await Cart.openRailFareRulesDialog(this.page, 0);
});

When("I close the Amtrak fare rules modal", async function () {
  logger.info("Closing the Amtrak fare rules modal");
  await Cart.closeRailFareRulesDialog(this.page);
});

When("I select the first Amtrak result from the more details drawer", async function () {
  logger.info("Selecting the Amtrak train from the More details drawer");
  await AmtrakResults.selectRailFromMoreDetails(this.page);
});

// ===== THEN STEPS =====

Then("the fare rules modal should show the supplier terms and conditions link", async function () {
  logger.info("Verifying the Supplier Terms & Conditions link in the Amtrak fare rules modal");
  const link = await AmtrakResults.getFareRulesSupplierTermsLink(this.page);
  logger.info("Supplier terms link read from the fare rules modal", link);

  expect(
    link.text,
    `The fare rules modal link should read "Supplier Terms & Conditions", but got: "${link.text}"`
  ).toBe("Supplier Terms & Conditions");
  expect(
    link.target,
    `The "Supplier Terms & Conditions" link should open in a new tab (target="_blank"), but got: "${link.target}"`
  ).toBe("_blank");
});

Then("the available classes and fares should be displayed", async function () {
  logger.info("Verifying the available classes and fares are displayed in the More details drawer");
  const title = await AmtrakResults.getMoreDetailsClassesTitle(this.page);

  expect(
    title,
    `The More details drawer should show the "Available Classes And Fares" section, but its heading read: "${title}"`
  ).toBe("Available Classes And Fares");
});

// ===== TODO STUBS — converted from Testim (need DSL/Page implementation) =====

When("I check fare rules and add the Amtrak round trip to cart", async function () {
  throw new Error("TODO: Implement checking fare rules for outbound (Cancellations, Changes, Supplier T&C) and return results, selecting 6th result and adding to cart. See Amtrak_results___Check_fare_rules_and_add_to_trip() in Testim source.");
});

When("I verify the out of policy indicator in the first Amtrak result details", async function () {
  throw new Error("TODO: Implement expanding first result details, clicking first class radio button, verifying shield icon is visible inside the details panel, and closing overlay. See OOP_is_displayed_in_results() in Testim source.");
});

When("I add the out of policy Amtrak result to cart", async function () {
  throw new Error("TODO: Implement selecting first Amtrak result, waiting for OOP badge ('.app-out-of-policy'), hovering info icon, verifying 'Upgrade cost is greater than 5 USD' tooltip, and clicking add to trip. See Add_Amtrak_one_way_from_search_results_to_cart() in Testim source.");
});
