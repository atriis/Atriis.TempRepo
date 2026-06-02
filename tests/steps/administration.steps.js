const { When, Then } = require("@cucumber/cucumber");
const { Administration } = require("@dsl");
const logger = require("@utils/logger").child("Administration");

// --- Administration portal navigation ---

When("I navigate to the administration page", async function () {
  logger.info("Navigating to the administration portal");
  const adminTab = await Administration.navigateToAdministration(this.page);
  this.adminPage = adminTab;
});

When("I switch to the administration page", async function () {
  logger.info("Switching to the existing administration tab");
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await this.adminPage.bringToFront();
  // Reload to ensure a clean state after background changes (e.g. profile popup save)
  await this.adminPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await this.adminPage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
});

When("I search for user {string} in the administration", async function (userName) {
  logger.info("Searching for user in administration", { userName });
  await Administration.searchUserInAdmin(this.adminPage, userName);
});

When("I open the form of payment tab in the administration", async function () {
  logger.info("Opening Form of Payment tab in administration user view");
  await Administration.openFopTabInAdmin(this.adminPage);
});

When("I navigate to the Travel Policies section", async function () {
  logger.info("Navigating to the Travel Policies section in administration");
  await Administration.openTravelPoliciesSection(this.adminPage);
});

When("I search for policy {string}", async function (policyName) {
  logger.info("Searching for travel policy in administration", { policyName });
  await Administration.searchTravelPolicy(this.adminPage, policyName);
});

When("I open the first travel policy rule", async function () {
  logger.info("Opening the first travel policy rule in administration");
  await Administration.openFirstTravelPolicyRule(this.adminPage);
});

Then("the flight direction dropdown should contain {string}, {string}, and {string}", async function (anyFlight, inboundFlight, outboundFlight) {
  logger.info("Verifying flight direction dropdown options in administration", { anyFlight, inboundFlight, outboundFlight });
  await Administration.verifyFlightDirectionDropdownOptions(this.adminPage, [anyFlight, inboundFlight, outboundFlight]);
});

Then("the credit card {string} should show expiry month {string} and year {string}", async function (cardName, month, year) {
  logger.info("Verifying credit card expiry in administration", { cardName, month, year });
  await Administration.verifyCcExpiryInAdmin(this.adminPage, { cardName, month, year });
});

When("I delete the credit card {string} from the administration", async function (cardName) {
  logger.info("Deleting credit card from administration", { cardName });
  await Administration.deleteCcFromAdmin(this.adminPage, cardName);
});

When("I clear the mobile field for user {string} in the administration", async function (userName) {
  logger.info("Clearing mobile field for user in administration", { userName });
  await Administration.clearUserMobileInAdmin(this.adminPage, userName);
});

Then("the mobile field should show country code {string} area code {string} and number {string}", async function (countryCode, areaCode, number) {
  logger.info("Verifying mobile values in administration", { countryCode, areaCode, number });
  await Administration.verifyMobileInAdmin(this.adminPage, { countryCode, areaCode, number });
});
