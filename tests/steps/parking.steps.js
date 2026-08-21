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

When("I edit the UK parking search from the results page", async function () {
  logger.info("Editing UK parking search from results page");
  // TODO: implement UKParkingSearch.editSearchFromResultsPage(page) in src/dsl/UKParkingSearch.js
  // Needs to:
  //   1. Click .edit-search-btn
  //   2. Click [placeholder='Parking from'] to open calendar
  //   3. Navigate calendar and select new dates
  //   4. Click .btn--size-large to re-search
  //   5. Wait for 'Add to trip' text to appear in results
  throw new Error("TODO: implement UKParkingSearch.editSearchFromResultsPage DSL method");
});

When("I verify there is only one parking quote in the cart", async function () {
  logger.info("Verifying there is only one parking quote in the cart");
  // TODO: implement UKParkingCart.verifyOnlyOneParkingQuoteInCart(page) in src/dsl/UKParkingCart.js
  // Should compare the cart summary item price against the cart total price to confirm no duplication
  // Note: the original Testim k() function had incomplete TODOs and used undefined variables
  throw new Error("TODO: implement UKParkingCart.verifyOnlyOneParkingQuoteInCart DSL method");
});

When("I open and validate the UK parking more details drawer", async function () {
  logger.info("Opening and validating UK parking more details drawer");
  // TODO: implement UKParkingCart.openAndValidateMoreDetails(page) in src/dsl/UKParkingCart.js
  // Should:
  //   1. Click .ticket-top-section a (the 'More details' link)
  //   2. Wait for .info-container > :nth-child(1) .section-title to contain 'Why book:'
  //   3. Close the drawer via #el-drawer__title > button > i
  throw new Error("TODO: implement UKParkingCart.openAndValidateMoreDetails DSL method");
});

When("I select the first parking filter option", async function () {
  logger.info("Selecting first parking filter option");
  await UKParkingResults.selectFirstFilterOption(this.page);
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

