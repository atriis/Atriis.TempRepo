require("module-alias/register");
const { When, Then, After } = require("@cucumber/cucumber");
const { Administration, LegacyGtp } = require("@dsl");
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

// --- Passports and Visas / Frequent flyer tabs (test 29785 — prevent updating personal information) ---

When("I open the passports and visas tab in the administration", async function () {
  logger.info("Opening the Passports and Visas tab in administration user view");
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.openPassportsAndVisasTabInAdmin(this.adminPage);
});

Then("the passport section should be empty in the administration", async function () {
  logger.info("Verifying no passport is saved on the administration user profile");
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.verifyPassportSectionEmpty(this.adminPage);
});

When("I open the frequent flyer tab in the administration", async function () {
  logger.info("Opening the Frequent flyer tab in administration user view");
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.openFrequentFlyerTabInAdmin(this.adminPage);
});

Then("the frequent flyer number {string} should not be saved in the administration", async function (frequentFlyerNumber) {
  logger.info("Verifying the frequent flyer number was not saved to the administration", { frequentFlyerNumber });
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.verifyValueNotSavedInUserProfile(
    this.adminPage,
    frequentFlyerNumber,
    "Frequent flyer / Membership number",
  );
});

Then("the car loyalty number {string} should not be saved in the administration", async function (carLoyaltyNumber) {
  logger.info("Verifying the car loyalty number was not saved to the administration", { carLoyaltyNumber });
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.verifyValueNotSavedInUserProfile(this.adminPage, carLoyaltyNumber, "Car loyalty ID");
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

// --- Per Diem removal flow (test 18418) ---

When("I open the Users tab in the administration", async function () {
  logger.info("Opening the Users tab in administration");
  await Administration.openUsersTab(this.adminPage);
});

Then("the administration users list should be displayed", async function () {
  logger.info("Verifying the administration users list is displayed");
  await Administration.verifyUsersListDisplayed(this.adminPage);
});

When("I open the first user in the administration users list", async function () {
  logger.info("Opening the first user in the administration users list");
  await Administration.openFirstUserInAdmin(this.adminPage);
});

Then("the user detail form should be displayed in the administration", async function () {
  logger.info("Verifying the user detail form is displayed in administration");
  await Administration.verifyUserDetailFormDisplayed(this.adminPage);
});

Then("the Per Diem section should be displayed in the administration", async function () {
  logger.info("Verifying the Per Diem section is displayed in administration");
  await Administration.verifyPerDiemSectionDisplayed(this.adminPage);
});

When("I set the per diem setting to {string} for the administration user", async function (perDiemValue) {
  logger.info("Setting the per diem setting for the administration user", { perDiemValue });
  await Administration.setPerDiemSetting(this.adminPage, perDiemValue);
});

Then("the per diem setting should show {string}", async function (expectedValue) {
  logger.info("Verifying the per diem setting shown in administration", { expectedValue });
  await Administration.verifyPerDiemSettingShows(this.adminPage, expectedValue);
});

When("I reopen the user {string} from the administration users list", async function (userName) {
  logger.info("Reopening user from the administration users list", { userName });
  await Administration.reopenUserByName(this.adminPage, userName);
});

// --- Roles admin section (test 40136) ---

When("I open the Roles section in the administration", async function () {
  logger.info("Opening the Roles section in administration");
  await Administration.openRolesSection(this.adminPage);
});

When("I click add new role in the administration", async function () {
  logger.info("Clicking Add new role in administration");
  await Administration.addNewRole(this.adminPage);
});

When("I enter a random role name in the administration", async function () {
  logger.info("Entering a random role name in administration");
  this.createdRoleName = await Administration.enterRandomRoleName(this.adminPage);
  logger.info("Stored created role name on the world", { createdRoleName: this.createdRoleName });
});

When("I select all privileges for the role in the administration", async function () {
  logger.info("Selecting all privileges for the role in administration");
  await Administration.selectAllRolePrivileges(this.adminPage);
});

When("I add the user {string} to the role in the administration", async function (userName) {
  logger.info("Adding user to the role in administration", { userName });
  await Administration.addUserToRole(this.adminPage, userName);
});

When("I save the role in the administration", async function () {
  logger.info("Saving the role in administration");
  await Administration.saveRole(this.adminPage);
});

When("I search for the created role in the administration", async function () {
  if (!this.createdRoleName) {
    throw new Error('[administration.steps] No created role name stored — call "I enter a random role name in the administration" first.');
  }
  logger.info("Searching for the created role in administration", { roleName: this.createdRoleName });
  await Administration.searchCreatedRole(this.adminPage, this.createdRoleName);
});

Then("the created role should be listed in the administration", async function () {
  if (!this.createdRoleName) {
    throw new Error('[administration.steps] No created role name stored — call "I enter a random role name in the administration" first.');
  }
  logger.info("Verifying the created role is listed in administration", { roleName: this.createdRoleName });
  await Administration.verifyCreatedRoleListed(this.adminPage, this.createdRoleName);
});

Then("the delete role button should be visible in the administration", async function () {
  logger.info("Verifying the delete role button is visible in administration");
  await Administration.verifyDeleteRoleButtonVisible(this.adminPage);
});

When("I click the delete role button in the administration", async function () {
  logger.info("Clicking the delete role button in administration");
  await Administration.clickDeleteRole(this.adminPage);
});

Then("the delete role dialog should be displayed in the administration", async function () {
  logger.info("Verifying the delete role dialog is displayed in administration");
  await Administration.verifyDeleteRoleDialogDisplayed(this.adminPage);
});

When("I confirm the role deletion in the administration", async function () {
  logger.info("Confirming the role deletion in administration");
  await Administration.confirmRoleDeletion(this.adminPage);
});

// --- Per Diem Settings admin section (test 40136) ---

When("I open the Per Diem Settings section in the administration", async function () {
  logger.info("Opening the Per Diem Settings section in administration");
  await Administration.openPerDiemSettingsSection(this.adminPage);
});

When("I open the {string} per diem in the administration", async function (perDiemName) {
  logger.info("Opening a named per diem in administration", { perDiemName });
  await Administration.openNamedPerDiem(this.adminPage, perDiemName);
});

Then("the per diem general information should be displayed in the administration", async function () {
  logger.info("Verifying the per diem general information is displayed in administration");
  await Administration.verifyPerDiemGeneralInfoDisplayed(this.adminPage);
});

When("I add a new destination to the per diem in the administration", async function () {
  logger.info("Adding a new destination to the per diem in administration");
  await Administration.addPerDiemDestination(this.adminPage);
});

When("I select the first destination in the per diem in the administration", async function () {
  logger.info("Selecting the first destination in the per diem in administration");
  await Administration.selectFirstDestination(this.adminPage);
});

When("I set the per diem daily sum to {string} in the administration", async function (value) {
  logger.info("Setting the per diem daily sum in administration", { value });
  await Administration.setPerDiemDailySum(this.adminPage, value);
});

When("I select the first per diem currency in the administration", async function () {
  logger.info("Selecting the first per diem currency in administration");
  await Administration.selectFirstPerDiemCurrency(this.adminPage);
});

When("I save the per diem in the administration", async function () {
  logger.info("Saving the per diem in administration");
  await Administration.savePerDiem(this.adminPage);
});

When("I remove the destination from the per diem in the administration", async function () {
  logger.info("Removing the destination from the per diem in administration");
  await Administration.removePerDiemDestination(this.adminPage);
});

Then("the destination should no longer be listed in the per diem in the administration", async function () {
  logger.info("Verifying the destination is no longer listed in the per diem in administration");
  await Administration.verifyDestinationNoLongerListed(this.adminPage);
});

// --- Deactivate user with dependencies (test 37921) ---

Then("the administration users table should display the {string} column header", async function (expectedHeader) {
  logger.info("Verifying administration users table column header", { expectedHeader });
  await Administration.verifyUsersTableColumnHeader(this.adminPage, expectedHeader);
});

When("I ensure the administration user {string} is active", async function (userName) {
  logger.info("Ensuring the administration user is active before the deactivation flow", { userName });
  await Administration.ensureUserIsActive(this.adminPage, userName);
});

When("I filter the administration users by {string}", async function (userName) {
  logger.info("Filtering administration users", { userName });
  await Administration.filterUsersInAdmin(this.adminPage, userName);
});

Then("the administration user results should contain {string}", async function (expectedText) {
  logger.info("Verifying administration user results contain text", { expectedText });
  await Administration.verifyFirstUserResultContains(this.adminPage, expectedText);
});

When("I select the first user in the administration results", async function () {
  logger.info("Selecting the first user in the administration results");
  await Administration.selectFirstUserInResults(this.adminPage);
});

When("I click the deactivate user button in the administration", async function () {
  logger.info("Clicking the deactivate user button in administration");
  await Administration.clickDeactivateUser(this.adminPage);
});

Then("the deactivation dependencies popup should state {string}", async function (expectedText) {
  logger.info("Verifying deactivation dependencies popup statement", { expectedText });
  await Administration.verifyDeactivationPopupStatement(this.adminPage, expectedText);
});

Then("the deactivation dependencies popup should list the dependency {string}", async function (expectedDependency) {
  logger.info("Verifying deactivation dependencies popup lists dependency", { expectedDependency });
  await Administration.verifyDeactivationPopupDependency(this.adminPage, expectedDependency);
});

When("I confirm the user deactivation in the popup", async function () {
  logger.info("Confirming the user deactivation in the popup");
  await Administration.confirmUserDeactivation(this.adminPage);
});

Then("I manually verify the deactivated user is no longer listed as a dependency", async function () {
  logger.info("Verifying the deactivated user is no longer listed as an active dependency");
  await Administration.verifyUserNotListedAsDependency(this.adminPage);
});

When("I show inactive users in the administration", async function () {
  logger.info("Showing inactive users in administration");
  await Administration.showInactiveUsers(this.adminPage);
});

Then("the administration user status should be {string}", async function (expectedStatus) {
  logger.info("Verifying administration user status", { expectedStatus });
  await Administration.verifyUserStatusBadge(this.adminPage, expectedStatus);
});

Then("the approval flow dependency should display {string}", async function (expectedValue) {
  logger.info("Verifying approval flow dependency value", { expectedValue });
  await Administration.verifyApprovalFlowDependency(this.adminPage, expectedValue);
});

When("I open the first dependency link in the deactivation popup", async function () {
  logger.info("Opening the first dependency link in the deactivation popup");
  this.linkedDependencyTab = await Administration.openFirstDependencyLink(this.adminPage);
});

Then("the linked dependency page should display the name {string}", async function (expectedName) {
  logger.info("Verifying linked dependency page name", { expectedName });
  await Administration.verifyLinkedDependencyName(this.linkedDependencyTab, expectedName);
});

When("I close the deactivation dependencies popup", async function () {
  logger.info("Closing the deactivation dependencies popup");
  await Administration.closeDeactivationPopup(this.adminPage);
});

When("I activate the first user in the administration", async function () {
  logger.info("Reactivating the first user in the administration");
  await Administration.activateFirstUser(this.adminPage);
});

// --- Corporate email provider setting (test 48270 / 51634) ---

Then("the corporate main email provider setting should be displayed in the administration", async function () {
  logger.info("Verifying the corporate main email provider setting is displayed in the administration");
  await Administration.verifyEmailProviderSettingDisplayed(this.adminPage);
});

Then("the corporate main email provider tooltip should show the title {string} in the administration", async function (expectedTitle) {
  logger.info("Verifying the corporate main email provider tooltip title", { expectedTitle });
  await Administration.verifyEmailProviderTooltipTitle(this.adminPage, expectedTitle);
});

When("I open the corporate main email provider dropdown in the administration", async function () {
  logger.info("Opening the corporate main email provider dropdown in the administration");
  await Administration.openEmailProviderDropdown(this.adminPage);
});

Then("the corporate main email provider option {int} should be visible in the administration as {string}", async function (index, expectedText) {
  logger.info("Verifying the corporate main email provider dropdown option", { index, expectedText });
  await Administration.verifyEmailProviderDropdownOption(this.adminPage, index, expectedText);
});

Then("the corporate main email provider dropdown should contain {int} options", async function (expectedCount) {
  logger.info("Verifying the corporate main email provider dropdown option count", { expectedCount });
  await Administration.verifyEmailProviderDropdownOptionCount(this.adminPage, expectedCount);
});

// --- Agreements / PTC Special Fares tooltip edit (test 27016) ---

When("I open the Agreements section in the administration", async function () {
  logger.info("Opening the Agreements section in administration");
  if (!this.adminPage) {
    throw new Error('[administration.steps] No admin page stored — call "I navigate to the administration page" first.');
  }
  await Administration.openAgreementsSection(this.adminPage);
});

When("I open the first agreement listed under the {string} category in the administration", async function (categoryName) {
  logger.info("Opening the first agreement listed under a category in administration", { categoryName });
  await Administration.openFirstAgreementUnderCategory(this.adminPage, categoryName);
});

// Side effect: stores the generated tooltip on the world, so the pricing-options hover assertion
// can check for the exact value written here.
When("I enter a random value into the agreement tooltip in the administration", async function () {
  logger.info("Entering a random value into the agreement tooltip in administration");
  this.generatedAgreementTooltip = await Administration.enterRandomAgreementTooltipValue(this.adminPage);
  logger.info("Stored the generated agreement tooltip on the world", {
    generatedAgreementTooltip: this.generatedAgreementTooltip,
  });
});

When("I enter the agreement tooltip value {string} in the administration", async function (tooltipValue) {
  logger.info("Entering a fixed value into the agreement tooltip in administration", { tooltipValue });
  await Administration.enterAgreementTooltipValue(this.adminPage, tooltipValue);
});

When("I enter the comment {string} for the agreement change in the administration", async function (comment) {
  logger.info("Entering the required comment for the agreement change in administration", { comment });
  await Administration.enterAgreementChangeComment(this.adminPage, comment);
});

When("I save the agreement in the administration", async function () {
  logger.info("Saving the agreement in administration");
  await Administration.saveAgreement(this.adminPage);
});

Then("the agreement tooltip should display {string} in the administration", async function (expectedTooltip) {
  logger.info("Verifying the agreement tooltip value in administration", { expectedTooltip });
  await Administration.verifyAgreementTooltipValue(this.adminPage, expectedTooltip);
});

// --- Agency Fare Rules Management markup in the legacy GTP administration (tests 43181, 43182) ---
//
// The agency fare rules markup is shared, live configuration of a dev agency, so a scenario that
// changes it owns putting it back. The first reading of the section is kept as the agency's real
// state (this.originalAgencyFareRules); the moment a change is about to be saved, a restore is owed
// (this.agencyFareRulesRestoreOwed). The explicit restore step settles it, and the After hook below
// settles it whenever a scenario fails or stops before reaching that step.

const AGENCY_FARE_RULE_FEE_NAMES = { "change fee": "change", "cancellation fee": "cancel" };
const AGENCY_FARE_RULES_COMMENT = "Automation - agency fare rules markup test";

function requireAgentAdminPage(world) {
  if (!world.legacyGtpPage) {
    throw new Error(
      '[administration.steps] No legacy GTP tab on the World. Run "I log in to legacy GTP as the agent ..." first.'
    );
  }
  return world.legacyGtpPage;
}

/**
 * Reads the markup table: | fee | markup | markup type | currency |, one row per fee
 * ("Change fee" / "Cancellation fee").
 */
function parseAgencyFareRulesTable(dataTable) {
  const rules = {};
  for (const row of dataTable.hashes()) {
    const fee = AGENCY_FARE_RULE_FEE_NAMES[String(row.fee || "").trim().toLowerCase()];
    if (!fee) {
      throw new Error(
        `[administration.steps] Unknown fee "${row.fee}" in the markup table. Use "Change fee" or "Cancellation fee".`
      );
    }
    const amount = Number.parseFloat(row.markup);
    if (Number.isNaN(amount)) {
      throw new Error(`[administration.steps] The markup "${row.markup}" for ${row.fee} is not a number.`);
    }
    rules[fee] = { amount, markupType: String(row["markup type"]).trim(), currency: String(row.currency).trim() };
  }
  return rules;
}

function sameAgencyFareRules(left, right) {
  return ["change", "cancel"].every((fee) => JSON.stringify(left?.[fee] ?? null) === JSON.stringify(right?.[fee] ?? null));
}

/**
 * Puts the agency fare rules back to what the scenario first read. Re-enters the admin from the
 * landing page, so it works whatever state the agent tab was left in; signs the agent back in on a
 * fresh tab when the original one is gone.
 */
async function restoreAgencyFareRules(world) {
  let page = world.legacyGtpPage;
  if (!page || page.isClosed()) {
    if (!world.browser || !world.legacyGtpAgentEmail) {
      throw new Error(
        "[administration.steps] The agency fare rules must be restored, but neither the agent tab nor a browser " +
        `to reopen it is available. Restore them by hand to: ${JSON.stringify(world.originalAgencyFareRules)}`
      );
    }
    const session = await LegacyGtp.createAgentSession(world.browser);
    world.legacyGtpContext = session.context;
    world.legacyGtpPage = page = session.page;
    await LegacyGtp.loginAsAgent(page, world.legacyGtpAgentEmail);
  }

  await LegacyGtp.openAgencyAdministration(page);
  const current = await Administration.openAgencyFareRulesManagement(page);
  if (sameAgencyFareRules(current, world.originalAgencyFareRules)) {
    logger.info("Agency fare rules already match their original values — nothing to restore", { current });
  } else {
    await Administration.setAgencyFareRules(page, world.originalAgencyFareRules, `${AGENCY_FARE_RULES_COMMENT} - restore`);
  }
  const restored = await Administration.verifyAgencyFareRules(page, world.originalAgencyFareRules);
  world.agencyFareRulesRestoreOwed = false;
  logger.info("Agency fare rules restored to their original values", {
    original: world.originalAgencyFareRules,
    changedTo: world.agencyFareRulesMarkup,
    readBack: restored,
  });
  return restored;
}

When("I open the Agency Fare Rules Management in the legacy GTP administration", async function () {
  const page = requireAgentAdminPage(this);
  logger.info("Opening Fare Management > Agency Fare Rules Management in the legacy GTP administration");
  const { agencyId } = await LegacyGtp.openAgencyAdministration(page);
  const rules = await Administration.openAgencyFareRulesManagement(page);
  // Only the FIRST reading is the agency's real state; a later one may already be this scenario's change.
  if (!this.originalAgencyFareRules) {
    this.originalAgencyFareRules = rules;
  }
  logger.info("Agency fare rules found before the scenario changes anything", { agencyId, rules });
});

When("I set the agency fare rules markup in the legacy GTP administration:", async function (dataTable) {
  const page = requireAgentAdminPage(this);
  if (!this.originalAgencyFareRules) {
    throw new Error(
      '[administration.steps] The original agency fare rules were not recorded. Run "I open the Agency Fare Rules ' +
      'Management in the legacy GTP administration" first, so the change can be undone.'
    );
  }
  const markup = parseAgencyFareRulesTable(dataTable);
  logger.info("Setting the agency fare rules markup", { markup, original: this.originalAgencyFareRules });

  // Owed BEFORE the save: a save that lands but whose answer is lost must still be undone.
  this.agencyFareRulesRestoreOwed = true;
  await Administration.setAgencyFareRules(page, markup, AGENCY_FARE_RULES_COMMENT);
  this.agencyFareRulesMarkup = markup;
});

When("I remove the agency fare rules markup in the legacy GTP administration", async function () {
  const page = requireAgentAdminPage(this);
  if (!this.originalAgencyFareRules) {
    throw new Error(
      '[administration.steps] The original agency fare rules were not recorded. Run "I open the Agency Fare Rules ' +
      'Management in the legacy GTP administration" first, so the change can be undone.'
    );
  }
  logger.info("Removing the agency fare rules markup", { original: this.originalAgencyFareRules });
  // Owed BEFORE any save: a save that lands but whose answer is lost must still be undone. When nothing
  // was saved, restoreAgencyFareRules finds the rules unchanged and saves nothing.
  this.agencyFareRulesRestoreOwed = true;
  const { rules } = await Administration.removeAgencyFareRulesMarkup(
    page,
    this.originalAgencyFareRules,
    `${AGENCY_FARE_RULES_COMMENT} - remove markup`
  );
  this.agencyFareRulesMarkup = rules;
});

Then("the agency fare rules should have no markup in the legacy GTP administration", async function () {
  const expected = this.agencyFareRulesMarkup ?? { change: null, cancel: null };
  logger.info("Verifying the agency fare rules carry no markup", { expected });
  await Administration.verifyAgencyFareRules(requireAgentAdminPage(this), expected);
});

Then("the agency fare rules markup should be saved in the legacy GTP administration", async function () {
  if (!this.agencyFareRulesMarkup) {
    throw new Error('[administration.steps] No markup was set. Run "I set the agency fare rules markup ..." first.');
  }
  logger.info("Verifying the agency fare rules markup was saved", { markup: this.agencyFareRulesMarkup });
  await Administration.verifyAgencyFareRules(requireAgentAdminPage(this), this.agencyFareRulesMarkup);
});

When("I restore the original agency fare rules markup in the legacy GTP administration", async function () {
  if (!this.originalAgencyFareRules) {
    throw new Error("[administration.steps] The original agency fare rules were never recorded, so there is nothing to restore.");
  }
  logger.info("Restoring the original agency fare rules", { original: this.originalAgencyFareRules });
  await restoreAgencyFareRules(this);
});

// Hooks in step files run before the support hooks.js teardown, so the browser is still open here.
After({ name: "Restore the agency fare rules markup", timeout: 240000 }, async function () {
  if (!this.agencyFareRulesRestoreOwed) {
    return;
  }
  logger.warn("The scenario ended with the agency fare rules still changed — restoring them in teardown", {
    original: this.originalAgencyFareRules,
    changedTo: this.agencyFareRulesMarkup,
  });
  await restoreAgencyFareRules(this);
});
