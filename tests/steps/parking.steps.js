require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { UKParkingSearch, UKParkingResults, UKParkingCart } = require("../../src/dsl");
const { getPageObject } = require("@utils/pageObjectCache");
const { ResultsPage } = require("@pages/ResultsPage");
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

When("I add a guest with user group as primary traveler", async function () {
  logger.info("Adding a guest with user group settings as primary traveler");
  // TODO: implement UKParkingSearch.addGuestWithUserGroupAsPrimary(page) in src/dsl/UKParkingSearch.js
  // Follows add_guest_as_prime_with_UG() from Testim:
  //   1. Click .add-btn .material-symbols-outlined
  //   2. Click .has-text-weight-semibold
  //   3. Wait for checkbox label /Use as primary/ then check .el-checkbox__inner
  //   4. Click .add-guest-btn, fill in guest first name, last name, email
  //   5. Select gender radio, copy settings, fill user group
  //   6. Select from dropdowns and confirm
  //   7. Wait for traveler list (.travelers-list > :nth-child(1) .traveler-name contains 'Lll Vvv')
  //   8. Click .btn--primary
  throw new Error("TODO: implement UKParkingSearch.addGuestWithUserGroupAsPrimary DSL method");
});

// ===== THEN STEPS =====

Then("the reset filters button should be visible", async function () {
  logger.info("Verifying reset filters button is visible");
  const resultsPage = getPageObject(this.page, ResultsPage);
  const button = resultsPage.getResetFiltersButton();
  await button.waitFor({ state: "visible", timeout: 15000 });
});

Then("the parking search should be pre-populated with airport {string}", async function (airport) {
  logger.info("Verifying parking search is pre-populated with airport", { airport });
  const element = this.page.locator("[valuekey='value']");
  await element.waitFor({ state: "visible", timeout: 15000 });
  const text = await element.textContent();
  expect(text).toContain(airport);
});

Then("no results should be found for UK parking", async function () {
  logger.info("Verifying no UK parking results are found");
  const noResults = this.page.locator("h3", { hasText: "No results found" });
  await noResults.waitFor({ state: "visible", timeout: 15000 });
});
