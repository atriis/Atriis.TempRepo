require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { GroundTransportSearch, GroundTransportResults, Cart } = require("../../src/dsl");
const { expectSumToBeEqualWithTolerance } = require("../../src/assertions/numberAssertions");
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

// Records the traveller and luggage counts the next ground transport search should carry, instead
// of driving the form here: every "I search for ground transport ..." step fills the whole form
// from scratch and ends by selecting the vehicle type and traveller count, so anything typed into
// the form before it would be overwritten. The search step below applies whatever this recorded.
When("I change number of traveler to {string} and luggage to {string} in Transferz search", async function (travellerNumber, luggage) {
  logger.info("Recording the traveller and luggage counts for the next ground transport search", {
    travellerNumber,
    luggage,
  });

  // Only the string-to-number conversion happens here — searchGroundTransport validates both
  // ranges, so repeating the checks would duplicate them across two layers.
  this.groundTransportTravellerNumber = Number(travellerNumber);
  this.groundTransportLuggage = Number(luggage);
});

When("I search for ground transport from airport {string} to specific address {string}", async function (from, to) {
  logger.info("Searching for ground transport from airport to specific address", { from, to });
  await GroundTransportSearch.searchGroundTransport(this.page, {
    fromMode: "airport",
    toMode: "specificAddress",
    from,
    to,
    ...(this.groundTransportTravellerNumber !== undefined
      ? { travellerNumber: this.groundTransportTravellerNumber }
      : {}),
    ...(this.groundTransportLuggage !== undefined
      ? { luggage: this.groundTransportLuggage }
      : {}),
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

// The reverse of "from airport {string} to specific address {string}". Both direction radios are
// set explicitly by searchGroundTransport, so this also covers re-submitting the form after a
// previous search left it pointing the other way round (73419).
When("I search for ground transport from specific address {string} to airport {string}", async function (from, to) {
  logger.info("Searching for ground transport from specific address to airport", { from, to });
  await GroundTransportSearch.searchGroundTransport(this.page, {
    fromMode: "specificAddress",
    toMode: "airport",
    from,
    to,
  });
});

// Opens the search from the cart's product carousel (NOT the cross-sell suggestion, which is
// "I click search button from {string}"): the drawer that tile opens is the one the app pre-fills
// from the flight already in the trip, which is what makes the pick-up time assertion meaningful.
When("I search for ground transport from cart validating prepopulated pickup time is displayed with pickup in {string} and drop off in {string}", async function (pickup, dropOff) {
  logger.info("Searching for ground transport from cart with prepopulated pickup time validation", { pickup, dropOff });
  const { pickupTime } = await GroundTransportSearch.searchFromCartCarouselValidatingPrepopulatedPickupTime(
    this.page,
    { pickup, dropOff },
  );
  logger.info("The cart search drawer's pre-populated pick-up time", { pickupTime });
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
  await GroundTransportSearch.searchAirportToSpecificAddressWithChangedPickupTime(this.page, from, to);
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
  await GroundTransportResults.filterByVehicleType(this.page, vehicleType);
});

When("I remove the ground transport vehicle filter {string}", async function (vehicleType) {
  logger.info("Removing ground transport vehicle filter", { vehicleType });
  await GroundTransportResults.removeVehicleTypeFilter(this.page, vehicleType);
});

When("I navigate back to ground transport search via breadcrumb", async function () {
  logger.info("Navigating back to ground transport search via breadcrumb");
  await GroundTransportResults.navigateBackToSearchViaBreadcrumb(this.page);
});

When("I extract the ground transport total price", async function () {
  logger.info("Extracting the ground transport total price from the cart");
  this.groundTransportTotalPrice = await Cart.extractCartTotalPrice(this.page);
  logger.info("Extracted ground transport total price", {
    groundTransportTotalPrice: this.groundTransportTotalPrice,
  });
});

// Same action as "I fill ground transport contact details in cart" (used by the Transferz features)
// — both phrasings are kept because each comes verbatim from its own manual test, and they share
// the one DSL method rather than duplicating the flow.
When("I add ground transport contact information", async function () {
  logger.info("Adding ground transport contact information");
  await Cart.fillGroundTransportContactDetails(this.page);
});

When("I add a ground transport free extra meet and greet", async function () {
  logger.info("Adding the free meet and greet ground transport extra");
  this.groundTransportFreeExtra = await Cart.addGroundTransportFreeExtra(this.page, "meet and greet");
  logger.info("Added the free meet and greet ground transport extra", this.groundTransportFreeExtra);
});

// The post-save reload is settled inside Cart.addGroundTransportFreeExtra, so this reads straight.
When("I extract the ground transport total price after adding free extra meet and greet", async function () {
  logger.info("Extracting the ground transport total price after adding the free extra");
  this.groundTransportTotalPriceAfterFreeExtra = await Cart.extractCartTotalPrice(this.page);
  logger.info("Extracted ground transport total price after adding the free extra", {
    groundTransportTotalPriceAfterFreeExtra: this.groundTransportTotalPriceAfterFreeExtra,
  });
});

When("I open transfer terms and conditions from trip overview", async function () {
  logger.info("Opening transfer terms and conditions from trip overview");
  notImplemented("I open transfer terms and conditions from trip overview");
});

When("I fill ground transport contact details in cart", async function () {
  logger.info("Filling ground transport contact details in cart");
  await Cart.fillGroundTransportContactDetails(this.page);
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

When("I edit the groundscope search from the results page drop off location only in {string} and search", async function (dropOffLocation) {
  logger.info("Editing the groundscope search from the results page", { dropOffLocation });
  await GroundTransportSearch.editSearchDropOffFromResultsPage(this.page, dropOffLocation);
});

// The results card prints the price NET of tax with the VAT on a separate line, while the cart
// charges their sum — so both are recorded and it is the SUM that is later compared to the cart
// (see "the ground transport results price with VAT should equal the cart price").
When("I extract the ground transport results price and VAT", async function () {
  logger.info("Extracting ground transport results price and VAT");
  const { price, vat } = await GroundTransportResults.extractPriceAndVat(this.page);
  this.groundTransportResultsPrice = price;
  this.groundTransportResultsVat = vat;
  logger.info("Extracted ground transport results price and VAT", {
    groundTransportResultsPrice: this.groundTransportResultsPrice,
    groundTransportResultsVat: this.groundTransportResultsVat,
  });
});

// ===== THEN STEPS =====

Then("ground transport results should be displayed", async function () {
  logger.info("Verifying ground transport results are displayed");
  await GroundTransportResults.expectResultsDisplayed(this.page);
});

// Route gate for a re-run search: "results should be displayed" alone cannot tell a reversed
// search apart from a repeat of the previous one, so this reads the pick-up/drop-off pair the
// results info bar echoes above the list (73419).
Then("the ground transport results should be for pickup {string} and drop off {string}", async function (pickup, dropOff) {
  logger.info("Verifying the ground transport results belong to the searched route", { pickup, dropOff });
  await GroundTransportResults.expectResultsRoute(this.page, { pickup, dropOff });
});

// Results-page counterpart of "the cart terms and conditions should include {string}" — the results
// card renders the supplier's rate disclaimer in its own append-to-body dialog, not in the cart's
// quote-card dialog, so the two cannot share one step. The DSL closes the dialog again.
Then("the ground transport terms and conditions should include {string}", async function (expectedText) {
  logger.info("Verifying ground transport results terms and conditions include expected text", { expectedText });
  await GroundTransportResults.verifyTermsAndConditionsInclude(this.page, expectedText);
});

Then("the ground transport pickup time should stay the same in cart and more details", async function () {
  logger.info("Verifying the ground transport pickup time matches between the cart card and More details");
  await Cart.verifyGroundTransportPickupTimeMatchesMoreDetails(this.page);
});

Then("the ground transport results price with VAT should equal the cart price", async function () {
  if (typeof this.groundTransportResultsPrice !== "number" || typeof this.groundTransportResultsVat !== "number") {
    throw new Error(
      "No ground transport results price/VAT stored (price: "
      + `${this.groundTransportResultsPrice}, VAT: ${this.groundTransportResultsVat}). `
      + "Run \"When I extract the ground transport results price and VAT\" on the results page "
      + "before this step."
    );
  }

  const cartPrice = await Cart.extractCartTotalPrice(this.page);

  if (typeof cartPrice !== "number" || Number.isNaN(cartPrice)) {
    throw new Error(
      `Could not read the cart total price to compare against the results price, got: ${cartPrice}. `
      + "The cart may still be loading, or it holds no priced quote."
    );
  }

  logger.info("Comparing the ground transport results price plus VAT with the cart price", {
    resultsPrice: this.groundTransportResultsPrice,
    resultsVat: this.groundTransportResultsVat,
    cartPrice,
  });

  expectSumToBeEqualWithTolerance(
    this.groundTransportResultsPrice,
    this.groundTransportResultsVat,
    cartPrice,
    0.02,
    "Ground transport results price + VAT vs cart price"
  );
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

// Registered under the phrase the manual test uses verbatim. Replaced the never-called
// "ground transport results should match the vehicle filter {string}" stub rather than adding a
// second phrase for the same assertion.
Then("all the ground transport options on this page contain {string} model text", async function (vehicleType) {
  logger.info("Verifying every ground transport option advertises the vehicle type", { vehicleType });
  await GroundTransportResults.expectAllResultsVehicleType(this.page, vehicleType);
});

Then("the ground transport more details link should be visible", async function () {
  logger.info("Verifying ground transport more details link is visible");
  await this.page.locator(".more-details").first().waitFor({ state: "visible", timeout: 15000 });
});

// Reads the total LIVE ("current total price") rather than reusing the value the preceding extract
// step stored, so a total that drifts between the two reads is caught here.
Then(
  "ground transport current total price is equal to ground transport free extra meet and greet plus ground transport total price",
  async function () {
    if (typeof this.groundTransportTotalPrice !== "number") {
      throw new Error(
        '[ground_transport.steps] No ground transport total price stored — run "I extract the ground ' +
        'transport total price" before the extra is added.',
      );
    }
    if (typeof this.groundTransportFreeExtra?.price !== "number") {
      throw new Error(
        '[ground_transport.steps] No free extra price stored — run "I add a ground transport free extra ' +
        'meet and greet" first.',
      );
    }

    const currentTotal = await Cart.extractCartTotalPrice(this.page);

    logger.info("Comparing the ground transport total against the free extra plus the earlier total", {
      totalBeforeExtra: this.groundTransportTotalPrice,
      freeExtraPrice: this.groundTransportFreeExtra.price,
      totalAfterExtra: this.groundTransportTotalPriceAfterFreeExtra,
      currentTotal,
    });

    expectSumToBeEqualWithTolerance(
      this.groundTransportTotalPrice,
      this.groundTransportFreeExtra.price,
      currentTotal,
      1,
      `Ground transport cart total = total before the extra + "${this.groundTransportFreeExtra.label}" price`,
    );
  },
);

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

Then("the ground transport price, type of payment, date and time and add to trip button are displayed", async function () {
  logger.info("Verifying ground transport price section layout");
  await GroundTransportResults.expectPriceSectionLayout(this.page);
});

Then("the transfer booking code should be displayed on the trip", async function () {
  logger.info("Verifying transfer booking code on trip");
  // Stored on the world so the two share-preview steps assert the SAME code the trip shows,
  // rather than each independently settling for "some booking code is present".
  this.transferBookingCode = await Cart.extractTransferBookingCode(this.page);
  logger.info("Stored the transfer booking code for the share preview comparisons", {
    transferBookingCode: this.transferBookingCode,
  });
});

Then("the share quote preview should contain the transfer booking code", async function () {
  logger.info("Verifying share quote preview contains transfer booking code");
  // The share QUOTE email has a Simple/Detailed toggle and the code has to survive both views.
  await Cart.verifyTransferBookingCodeInSharePreview(this.page, this.transferBookingCode, {
    alsoCheckDetailedView: true,
  });
});

Then("the share itinerary preview should contain the transfer booking code", async function () {
  logger.info("Verifying share itinerary preview contains transfer booking code");
  await Cart.verifyTransferBookingCodeInSharePreview(this.page, this.transferBookingCode);
});

Then("the share quote preview should contain a ground transport image", async function () {
  logger.info("Verifying share quote preview contains a ground transport image");
  await Cart.verifyShareEmailContainsGroundScopeVehicleImage(this.page, "share quote");
});

Then("the share itinerary preview should contain a ground transport image", async function () {
  logger.info("Verifying share itinerary preview contains a ground transport image");
  await Cart.verifyShareEmailContainsGroundScopeVehicleImage(this.page, "share itinerary");
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
