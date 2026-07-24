require("module-alias/register");
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

Then("the admin section {string} should be visible", async function (sectionName) {
  logger.info("Verifying admin section is visible", { sectionName });
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.verifyAdminSectionVisible(this.adminPage, sectionName);
});

Then("only {string} sections are displayed in admin", async function (expectedCount) {
  const count = Number.parseInt(expectedCount, 10);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`[administration.steps] Section count must be a non-negative integer, got: "${expectedCount}"`);
  }
  logger.info("Verifying the number of admin sections displayed", { expectedCount: count });
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.verifyAdminSectionCount(this.adminPage, count);
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

// --- Add user / edit user / active-users filter (test 36297) ---

When("I click add new user in the administration", async function () {
  logger.info("Clicking Add new user in administration");
  await Administration.clickAddNewUser(this.adminPage);
});

Then("the new corporate user form should display the {string} field", async function (expectedLabel) {
  logger.info("Verifying new corporate user form field label", { expectedLabel });
  await Administration.verifyNewUserFormField(this.adminPage, expectedLabel);
});

When("I close the add new user popup in the administration", async function () {
  logger.info("Closing the add new user popup in administration");
  await Administration.closeAddNewUserPopup(this.adminPage);
});

When("I fill the first mandatory user field with a random value in the administration", async function () {
  logger.info("Filling the first mandatory user field with a random value in administration");
  await Administration.fillFirstMandatoryUserFieldWithRandomValue(this.adminPage);
});

When("I save the administration user", async function () {
  logger.info("Saving the administration user record");
  await Administration.saveUserRecordInAdmin(this.adminPage);
});

Then("the {string} confirmation toast should be displayed in the administration", async function (expectedText) {
  logger.info("Verifying confirmation toast in administration", { expectedText });
  await Administration.verifyAdminToast(this.adminPage, expectedText);
});

Then("the {string} filter should be visible in the administration user search bar", async function (expectedFilter) {
  logger.info("Verifying search-bar filter is visible in administration", { expectedFilter });
  await Administration.verifyAdminSearchBarFilter(this.adminPage, expectedFilter);
});

When("I clear the user search in the administration", async function () {
  logger.info("Clearing the user search in administration");
  await Administration.clearUserSearchInAdmin(this.adminPage);
});

Then("the inactive users filter should be unchecked in the administration", async function () {
  logger.info("Verifying the inactive users filter is unchecked in administration");
  await Administration.verifyInactiveUsersFilterUnchecked(this.adminPage);
});

Then("the active users filter should be checked in the administration", async function () {
  logger.info("Verifying the active users filter is checked in administration");
  await Administration.verifyActiveUsersFilterChecked(this.adminPage);
});

Then("only active users should be listed in the administration", async function () {
  logger.info("Verifying only active users are listed in administration");
  await Administration.verifyOnlyActiveUsersListed(this.adminPage);
});

Then("the mobile field should show country code {string} area code {string} and number {string}", async function (countryCode, areaCode, number) {
  logger.info("Verifying mobile values in administration", { countryCode, areaCode, number });
  await Administration.verifyMobileInAdmin(this.adminPage, { countryCode, areaCode, number });
});
