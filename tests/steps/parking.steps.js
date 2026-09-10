require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { UKParkingSearch, UKParkingResults, UKParkingCart, Cart } = require("../../src/dsl");
const logger = require("@utils/logger").child("Parking");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I search for UK parking at {string}", async function (airport) {
  logger.info("Searching for UK parking", { airport });
  await UKParkingSearch.searchUKParking(this.page, airport);
});

When("I fill in UK parking trip details with mobile {string}, car make {string}, model {string}, registration {string}, colour {string}, outbound flight {string}, terminal {string}, return flight {string} and return terminal {string}", async function (mobile, carMake, model, registration, colour, outboundFlight, terminal, returnFlight, returnTerminal) {
  logger.info("Filling in UK parking trip details", { mobile, carMake, model, registration, colour, outboundFlight, terminal, returnFlight, returnTerminal });
  await UKParkingCart.fillTripOverviewDetails(this.page, {
    mobile, carMake, model, registration, colour, outboundFlight, terminal, returnFlight, returnTerminal,
  });
});

When("I edit the UK parking search by changing the dates from the results page", async function () {
  logger.info("Editing the UK parking search dates from the results page");
  const result = await UKParkingSearch.editSearchDatesFromResultsPage(this.page);
  logger.info("UK parking search re-submitted with new dates", result);
});

When("I select the first parking filter option", async function () {
  logger.info("Selecting first parking filter option");
  await UKParkingResults.selectFirstFilterOption(this.page);
});

When("I filter parking results by service type {string}", async function (serviceType) {
  logger.info("Filtering parking results by service type", { serviceType });
  const result = await UKParkingResults.filterByServiceType(this.page, serviceType);
  logger.info("Parking results filtered by service type", result);
});

When("I filter parking results by {string} and a terminal that has none", async function (serviceType) {
  logger.info("Filtering parking results to an empty terminal + service type pair", { serviceType });
  const result = await UKParkingResults.filterToTerminalWithoutServiceType(this.page, serviceType);
  logger.info("Applied a parking filter pair that yields no results", result);
});

When("I navigate back to parking search via breadcrumb", async function () {
  logger.info("Navigating back to parking search via breadcrumb");
  await UKParkingResults.navigateBackToSearchViaBreadcrumb(this.page);
});

// ===== THEN STEPS =====

Then("the parking search should be pre-populated with the departure airport of the flight in the cart", async function () {
  logger.info("Verifying the parking search inherited the flight's departure airport");
  const { departureAirportCode } = await Cart.getFlightDepartureAirport(this.page);
  const result = await UKParkingSearch.verifyLocationMatchesFlightOrigin(this.page, departureAirportCode);

  // Thrown rather than asserted through expect(): both sides of the comparison are the diagnostic
  // (bug 53809 is about the carried-over location being INCOMPLETE, not absent), and a custom
  // expect() message never reaches the report.
  if (!result.matches) {
    throw new Error(
      `Expected the parking search location to be pre-populated with "${result.expectedAirportName}" ` +
      `- the departure airport of the flight in the cart (${result.departureAirportCode}) - but the ` +
      `field holds "${result.prePopulatedLocation}".`
    );
  }
});

