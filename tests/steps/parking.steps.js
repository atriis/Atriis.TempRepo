require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { UKParkingSearch, UKParkingResults, UKParkingCart } = require("../../src/dsl");
const { expect } = require("@playwright/test");
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

When("I click the parking tab in the cart trip bar", async function () {
  logger.info("Clicking parking tab in the cart trip bar");
  const parkingTab = this.page.locator(".flicking-camera .icon-text", { hasText: "Parking" });
  await parkingTab.waitFor({ state: "visible", timeout: 15000 });
  await parkingTab.click();
});

When("I close the parking search panel", async function () {
  logger.info("Closing parking search panel");
  await this.page.click(".close-btn");
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

Then("the parking search should be pre-populated with airport {string}", async function (airport) {
  logger.info("Verifying parking search is pre-populated with airport", { airport });
  const element = this.page.locator("[valuekey='value']");
  await element.waitFor({ state: "visible", timeout: 15000 });
  const text = await element.textContent();
  expect(text).toContain(airport);
});

