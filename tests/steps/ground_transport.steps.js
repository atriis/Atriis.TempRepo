require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { GroundTransportSearch, Cart } = require("../../src/dsl");
const logger = require("@utils/logger").child("GroundTransport");

setDefaultTimeout(120000);

function notImplemented(stepName) {
  throw new Error(`TODO: implement ground transport step: ${stepName}`);
}

// ===== WHEN STEPS =====

When("I search for ground transport from {string}", async function (routeKey) {
  logger.info("Searching for ground transport", { routeKey });
  await GroundTransportSearch.searchGroundTransportFromAirportToSpecificAddress(this.page, routeKey);
});

When("I search for ground transport from airport {string} to specific address {string}", async function (from, to) {
  logger.info("Searching for ground transport from airport to specific address", { from, to });
  await GroundTransportSearch.searchGroundTransport(this.page, {
    fromMode: "airport",
    toMode: "specificAddress",
    from,
    to,
  });
});

When("I search for ground transport from specific address {string} to specific address {string}", async function (from, to) {
  logger.info("Searching for ground transport from specific address to specific address", { from, to });
  await GroundTransportSearch.searchGroundTransport(this.page, {
    fromMode: "specificAddress",
    toMode: "specificAddress",
    from,
    to,
  });
});

When("I search for ground transport from cart validating prepopulated pickup time with {string} and airline {string}", async function (pickup, airline) {
  logger.info("Searching for ground transport from cart with prepopulated time validation", { pickup, airline });
  notImplemented("I search for ground transport from cart validating prepopulated pickup time with {string} and airline {string}");
});

When("I search for ground transport from airport {string} to airport {string} changing the pickup time", async function (from, to) {
  logger.info("Searching for ground transport from airport to airport with changed pickup time", { from, to });
  notImplemented("I search for ground transport from airport {string} to airport {string} changing the pickup time");
});

// Stops short of submitting the search so the date and time just entered can still be read off
// the form (see "I extract the date and pickup time from ground transport search"); the scenario
// submits it afterwards with the generic "I click the search button".
When("I search for ground transport from airport {string} to airport {string} changing the pickup time without clicking search button", async function (from, to) {
  logger.info("Filling a ground transport airport-to-airport search with a changed pickup time, without submitting it", { from, to });
  await GroundTransportSearch.fillAirportToAirportSearchWithChangedPickupTime(this.page, from, to);
});

When("I extract the date and pickup time from ground transport search", async function () {
  logger.info("Extracting the pickup date and time from the ground transport search form");
  this.groundTransportSearchedPickup = await GroundTransportSearch.readSearchPickupDateAndTime(this.page);
});

When("I search for ground transport from airport {string} to specific address {string} changing the pickup time", async function (from, to) {
  logger.info("Searching for ground transport from airport to specific address with changed pickup time", { from, to });
  notImplemented("I search for ground transport from airport {string} to specific address {string} changing the pickup time");
});

When("I click search button from {string}", async function (suggestionTitle) {
  logger.info("Opening ground transport search from a cart suggestion", { suggestionTitle });
  await GroundTransportSearch.searchFromCartSuggestion(this.page, suggestionTitle);
});

When("I set drop off location to be {string}, vehicle type to be {string}, traveller to be {int} and click search button", async function (dropOffLocation, vehicleType, travellerNumber) {
  logger.info("Completing the prefilled ground transport search drawer", {
    dropOffLocation,
    vehicleType,
    travellerNumber,
  });
  await GroundTransportSearch.completeSearchDrawerAndSearch(this.page, {
    dropOffLocation,
    vehicleType,
    travellerNumber,
  });
});

When("I expand vehicle filters if available", async function () {
  logger.info("Expanding vehicle filters if available");
  notImplemented("I expand vehicle filters if available");
});

When("I filter ground transport results by vehicle type {string}", async function (vehicleType) {
  logger.info("Filtering ground transport results by vehicle type", { vehicleType });
  notImplemented("I filter ground transport results by vehicle type {string}");
});

When("I remove the ground transport vehicle filter {string}", async function (vehicleType) {
  logger.info("Removing ground transport vehicle filter", { vehicleType });
  notImplemented("I remove the ground transport vehicle filter {string}");
});

When("I capture the ground transport total price", async function () {
  logger.info("Capturing ground transport total price");
  notImplemented("I capture the ground transport total price");
});

When("I add ground transport contact information", async function () {
  logger.info("Adding ground transport contact information");
  notImplemented("I add ground transport contact information");
});

When("I add a ground transport extra", async function () {
  logger.info("Adding ground transport extra");
  notImplemented("I add a ground transport extra");
});

When("I open transfer terms and conditions from trip overview", async function () {
  logger.info("Opening transfer terms and conditions from trip overview");
  notImplemented("I open transfer terms and conditions from trip overview");
});

When("I fill ground transport contact details in cart", async function () {
  logger.info("Filling ground transport contact details in cart");
  notImplemented("I fill ground transport contact details in cart");
});

When("I navigate back to ground transport search as consultant {string}", async function (consultantName) {
  logger.info("Navigating back to ground transport search as consultant", { consultantName });
  notImplemented("I navigate back to ground transport search as consultant {string}");
});

When("I hover and validate the ground transport expiry counter", async function () {
  logger.info("Hovering and validating ground transport expiry counter");
  notImplemented("I hover and validate the ground transport expiry counter");
});

When("I open the current ground transport trip", async function () {
  logger.info("Opening current ground transport trip");
  notImplemented("I open the current ground transport trip");
});

When("I set the Transferz luggage selection", async function () {
  logger.info("Setting Transferz luggage selection");
  notImplemented("I set the Transferz luggage selection");
});

When("I edit the groundscope search from the results page", async function () {
  logger.info("Editing groundscope search from results page");
  notImplemented("I edit the groundscope search from the results page");
});

When("I extract the ground transport results price and VAT", async function () {
  logger.info("Extracting ground transport results price and VAT");
  notImplemented("I extract the ground transport results price and VAT");
});

// ===== THEN STEPS =====

Then("ground transport results should be displayed", async function () {
  logger.info("Verifying ground transport results are displayed");
  await this.page.locator(".ground-transport-list .btn--primary, .show-count p").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("I should see that pickup contains {string}", async function (expectedPickup) {
  logger.info("Verifying the prefilled ground transport pick-up location", { expectedPickup });
  // The drawer's pick-up field is filled in from the booked flight after the drawer renders, so
  // this polls the value instead of reading it once.
  await expect
    .poll(async () => GroundTransportSearch.readSearchDrawerPickupLocation(this.page), {
      timeout: 30000,
    })
    .toContain(expectedPickup);
});

Then("carrier is populated by text", async function () {
  logger.info("Verifying the ground transport carrier is prefilled");
  await expect
    .poll(async () => GroundTransportSearch.readSearchDrawerAirline(this.page), { timeout: 30000 })
    .not.toBe("");

  // Guard against reading the untouched field: Element Plus prints the placeholder in the same
  // node it later prints the chosen carrier in.
  const carrier = await GroundTransportSearch.readSearchDrawerAirline(this.page);

  if (/^select airline$/i.test(carrier.trim())) {
    throw new Error(
      "Expected the ground transport Airline field to be prefilled from the booked flight, but it "
      + `is still showing its "${carrier.trim()}" placeholder.`,
    );
  }
});

Then("the ground transport vehicle filter should be displayed", async function () {
  logger.info("Verifying ground transport vehicle filter is displayed");
  notImplemented("the ground transport vehicle filter should be displayed");
});

Then("ground transport results should match the vehicle filter {string}", async function (vehicleType) {
  logger.info("Verifying ground transport results match vehicle filter", { vehicleType });
  notImplemented("ground transport results should match the vehicle filter {string}");
});

Then("the ground transport more details link should be visible", async function () {
  logger.info("Verifying ground transport more details link is visible");
  await this.page.locator(".more-details").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("the ground transport total should include the selected extra", async function () {
  logger.info("Verifying ground transport total includes selected extra");
  notImplemented("the ground transport total should include the selected extra");
});

Then("the transfer booking status should be displayed", async function () {
  logger.info("Verifying transfer booking status is displayed");
  await this.page.locator("[class^='ml'], [class*=' ml']").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("the transfer terms and conditions modal should be displayed", async function () {
  logger.info("Verifying transfer terms and conditions modal is displayed");
  await this.page.locator(".el-dialog__body span").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("the transfer terms and conditions link should remain visible", async function () {
  logger.info("Verifying transfer terms and conditions link remains visible");
  await this.page.locator("[class^='px'], [class*=' px']").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("the ground transport pickup date and time should be displayed correctly in cart", async function () {
  logger.info("Verifying ground transport pickup date and time in cart", {
    searchedPickup: this.groundTransportSearchedPickup,
  });

  if (!this.groundTransportSearchedPickup) {
    throw new Error(
      "[ground_transport.steps] No searched pickup date/time was recorded, so there is nothing to "
      + "compare the cart against. The scenario has to run \"I extract the date and pickup time "
      + "from ground transport search\" while the filled search form is still on screen.",
    );
  }

  await Cart.verifyGroundTransportPickupDateTime(this.page, this.groundTransportSearchedPickup);
});

Then("the ground transport price section content should be displayed", async function () {
  logger.info("Verifying ground transport price section content");
  notImplemented("the ground transport price section content should be displayed");
});

Then("the transfer booking code should be displayed on the trip", async function () {
  logger.info("Verifying transfer booking code on trip");
  notImplemented("the transfer booking code should be displayed on the trip");
});

Then("the share quote preview should contain the transfer booking code", async function () {
  logger.info("Verifying share quote preview contains transfer booking code");
  notImplemented("the share quote preview should contain the transfer booking code");
});

Then("the share itinerary preview should contain the transfer booking code", async function () {
  logger.info("Verifying share itinerary preview contains transfer booking code");
  notImplemented("the share itinerary preview should contain the transfer booking code");
});

Then("the share quote preview should contain a ground transport image", async function () {
  logger.info("Verifying share quote preview contains a ground transport image");
  notImplemented("the share quote preview should contain a ground transport image");
});

Then("the share itinerary preview should contain a ground transport image", async function () {
  logger.info("Verifying share itinerary preview contains a ground transport image");
  notImplemented("the share itinerary preview should contain a ground transport image");
});

Then("no ground transport results should be found", async function () {
  logger.info("Verifying no ground transport results are found");
  await this.page.locator(".app-no-results").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("the ground transport availability actions should be displayed", async function () {
  logger.info("Verifying ground transport availability actions are displayed");
  await this.page.locator("[aria-label='Check fare availability...'] .btn--secondary").first().waitFor({ state: "visible", timeout: 15000 });
  await this.page.locator("[class^='ml'], [class*=' ml']").first().waitFor({ state: "visible", timeout: 15000 });
});

Then("the groundscope result in cart should be correct", async function () {
  logger.info("Verifying groundscope result in cart is correct");
  notImplemented("the groundscope result in cart should be correct");
});

Then("ground transport terms and conditions should be displayed in results", async function () {
  logger.info("Verifying ground transport terms and conditions in results");
  notImplemented("ground transport terms and conditions should be displayed in results");
});

Then("the ground transport pickup time should stay the same across the system", async function () {
  logger.info("Verifying ground transport pickup time stays the same across the system");
  notImplemented("the ground transport pickup time should stay the same across the system");
});

Then("the ground transport results price with VAT should equal the cart price", async function () {
  logger.info("Verifying ground transport results price with VAT equals cart price");
  notImplemented("the ground transport results price with VAT should equal the cart price");
});

Then("ground transport terms and conditions should be displayed in cart", async function () {
  logger.info("Verifying ground transport terms and conditions in cart");
  notImplemented("ground transport terms and conditions should be displayed in cart");
});

Then("ground transport terms and conditions should be displayed after booking", async function () {
  logger.info("Verifying ground transport terms and conditions after booking");
  notImplemented("ground transport terms and conditions should be displayed after booking");
});
