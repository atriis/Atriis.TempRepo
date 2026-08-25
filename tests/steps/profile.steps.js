require("module-alias/register");
const { When, Then } = require("@cucumber/cucumber");
const { Profile } = require("@dsl");
const logger = require("@utils/logger").child("Profile");

// --- Profile navigation steps ---

When("I navigate to my user profile", async function () {
  logger.info("Navigating to user profile page");
  const profilePage = await Profile.navigateToProfile(this.page);
  // Profile opens in a new tab — update the active page reference
  this.page = profilePage;
});

When("I open the frequent programs tab in my profile", async function () {
  logger.info("Opening frequent programs tab in user profile");
  await Profile.openFrequentProgramsTab(this.page);
});

When("I remove the FQTV entry {string} from my profile", async function (fqtvNumber) {
  logger.info("Removing FQTV entry from profile", { fqtvNumber });
  this.lastRemovedFqtvNumber = fqtvNumber;
  await Profile.removeFqtvEntry(this.page, fqtvNumber);
});

Then("the FQTV entry should no longer be visible in my profile", async function () {
  logger.info("Verifying FQTV entry is no longer visible");
  // Use the fqtvNumber from the previous remove step (stored contextually in the scenario)
  // The last removed number is "123456543" per the scenario — but we verify generically via DOM state
  await Profile.verifyFqtvEntryRemoved(this.page, this.lastRemovedFqtvNumber || "123456543");
});

When("I add a new FQTV entry with number {string} using the first available airline", async function (fqtvNumber) {
  logger.info("Adding new FQTV entry to profile", { fqtvNumber });
  await Profile.addFqtvEntry(this.page, fqtvNumber);
});

// --- BahnCard (Deutsche Bahn rail) frequent programs steps ---

// "DB BahnCard 50" is a DbRailCardTypes option label in the app — it must match the dropdown
// entry exactly, so it is spelled once here rather than parsed out of the step phrase.
const DB_BAHNCARD_50 = "DB BahnCard 50";

When(
  "I add DB BahnCard 50 with number {string} and expiration date {string}",
  async function (programNumber, expirationDate) {
    logger.info("Adding DB BahnCard 50", { programNumber, expirationDate });
    // Kept for the verification step, which re-reads the row after a reload.
    this.lastBahnCardNumber = programNumber;
    await Profile.addBahnCardProgram(this.page, {
      cardType: DB_BAHNCARD_50,
      programNumber,
      validUntil: expirationDate,
    });
  }
);

Then("the DB BahnCard 50 expiration date {string} should be saved", async function (expirationDate) {
  logger.info("Verifying DB BahnCard 50 expiration date persisted", { expirationDate });
  await Profile.verifyBahnCardProgramSaved(this.page, {
    cardType: DB_BAHNCARD_50,
    programNumber: this.lastBahnCardNumber,
    validUntil: expirationDate,
  });
});

When("I successfully remove the DB BahnCard frequent program entry", async function () {
  logger.info("Removing DB BahnCard frequent program entry");
  await Profile.removeBahnCardProgram(this.page);
});

// --- Contact Information steps ---

When("I open the contact information tab in my profile", async function () {
  logger.info("Opening Contact Information tab in user profile");
  await Profile.openContactInformationTab(this.page);
});

Then("the city field should contain {string}", async function (expectedValue) {
  logger.info("Verifying city field value", { expectedValue });
  await Profile.verifyCityFieldValue(this.page, expectedValue);
});

When("I save the profile changes", async function () {
  logger.info("Saving profile changes");
  await Profile.saveContactInfo(this.page);
});

Then("the business phone number should display country code {string} and area code {string} and number {string}", async function (countryCode, areaCode, number) {
  logger.info("Verifying business phone number", { countryCode, areaCode, number });
  await Profile.verifyBusinessPhoneNumber(this.page, { countryCode, areaCode, number });
});

Then("the state field should be visible with value {string}", async function (expectedValue) {
  logger.info("Verifying state field value", { expectedValue });
  await Profile.verifyStateField(this.page, expectedValue);
});

When("I open the permissions tab in my profile", async function () {
  logger.info("Opening permissions tab");
  await Profile.openPermissionsTab(this.page);
});

When("I open the {string} section", async function (sectionName) {
  logger.info("Opening permissions section", { sectionName });
  await Profile.openPermissionsSection(this.page, sectionName);
});

When("I remove a user from the booking permissions list", async function () {
  logger.info("Removing user from booking permissions list");
  await Profile.removeUserFromBookingPermissions(this.page);
});

Then("the user should be removed from the list", async function () {
  logger.info("Verifying user was removed from permissions list");
  await Profile.verifyUserRemovedFromPermissions(this.page);
});

When("I add {string} as a travel arranger", async function (arrangerName) {
  logger.info("Adding travel arranger", { arrangerName });
  await Profile.addTravelArranger(this.page, arrangerName);
});

Then("{string} should be displayed as the selected travel arranger", async function (expectedName) {
  logger.info("Verifying selected travel arranger", { expectedName });
  await Profile.verifyTravelArranger(this.page, expectedName);
});

// --- Traveler profile (from trip page) steps ---

When("I open the traveler profile for {string}", async function (travelerName) {
  logger.info("Opening traveler profile from trip page", { travelerName });
  const profilePage = await Profile.openTravelerProfile(this.page, travelerName);
  this.profilePage = profilePage;
  this.activePage = profilePage;
});

When("I edit the date of birth to a new date", async function () {
  logger.info("Editing date of birth in traveler profile");
  const targetPage = this.activePage || this.profilePage || this.page;
  const result = await Profile.editDateOfBirth(targetPage);
  this.originalDobValue = result.originalValue;
});

Then("the date of birth should be updated", async function () {
  logger.info("Verifying date of birth was updated");
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.verifyDobUpdated(targetPage, this.originalDobValue);
});

// --- Form of Payment steps ---

When("I open the form of payment tab in my profile", async function () {
  logger.info("Opening Form of Payment tab in user profile");
  await Profile.openFormOfPaymentTab(this.page);
});

When("I remove all existing credit cards from my profile", async function () {
  logger.info("Removing all existing credit cards to start from a clean state");
  await Profile.deleteAllCreditCards(this.page);
});

When("I add a new credit card with city {string} and cardholder {string}", async function (city, cardholder) {
  logger.info("Adding new credit card", { city, cardholder });
  await Profile.addCreditCard(this.page, { city, cardholder });
});

When("I add a credit card with name {string} type {string} number {string} expiry month {string} year {string}", async function (name, type, number, expiryMonth, expiryYear) {
  logger.info("Adding credit card with full details", { name, type, expiryMonth, expiryYear });
  await Profile.addCreditCardFull(this.page, { name, type, number, expiryMonth, expiryYear });
});

Then("the card holder name {string} should be displayed", async function (expectedName) {
  logger.info("Verifying card holder name is displayed", { expectedName });
  await Profile.verifyCardHolderName(this.page, expectedName);
});

Then("the card name {string} should be displayed in the profile", async function (cardName) {
  logger.info("Verifying card display name is shown in FOP preview", { cardName });
  await Profile.verifyCardName(this.page, cardName);
});

When("I delete the credit card from my profile", async function () {
  logger.info("Deleting credit card from profile");
  const result = await Profile.deleteCreditCard(this.page);
  this.cardCountBefore = result.countBefore;
});

Then("the credit card should be removed", async function () {
  logger.info("Verifying credit card was removed");
  await Profile.verifyCreditCardRemoved(this.page, this.cardCountBefore);
});

// --- Passports & Visas steps ---

When("I navigate to the passport and visa profile page from the traveler name", async function () {
  logger.info("Navigating to Passports & Visas tab from traveler name link");
  const targetPage = await Profile.navigateToPassportsFromTraveler(this.page);
  this.page = targetPage;
});

When("I add a visa with an expiration date and number {string}", async function (visaNumber) {
  logger.info("Adding visa with number", { visaNumber });
  await Profile.addVisa(this.page, { number: visaNumber });
});

When("I delete the visa from my profile", async function () {
  logger.info("Deleting visa from profile");
  await Profile.deleteVisa(this.page);
});

When("I open the passports and visas tab in my profile", async function () {
  logger.info("Opening Passports & Visas tab in user profile");
  await Profile.openPassportsAndVisasTab(this.page);
});

When("I enter a known traveler number with alphanumeric characters", async function () {
  const value = `ABC${Math.floor(Math.random() * 900 + 100)}DEF`;
  logger.info("Entering known traveler number", { value });
  const result = await Profile.enterKnownTravelerNumber(this.page, value);
  this.knownTravelerNumber = result.knownTravelerNumber;
});

When("I save the passports and visas changes", async function () {
  logger.info("Saving Passports & Visas changes");
  await Profile.savePassportsAndVisasChanges(this.page);
});

Then("the known traveler number should be saved correctly", async function () {
  logger.info("Verifying known traveler number was persisted", { expected: this.knownTravelerNumber });
  await Profile.verifyKnownTravelerNumberSaved(this.page, this.knownTravelerNumber);
});

When("I reset the known traveler number", async function () {
  logger.info("Resetting known traveler number to clean up profile state");
  await Profile.resetKnownTravelerNumber(this.page);
});

// --- Backup Approver steps ---

When("I add a backup approver by searching {string}", async function (searchTerm) {
  logger.info("Adding backup approver by searching", { searchTerm });
  await Profile.addBackupApprover(this.page, searchTerm);
});

Then("the backup approver field should show a name containing {string}", async function (text) {
  logger.info("Verifying backup approver contains", { text });
  await Profile.verifyBackupApproverContains(this.page, text);
});

When("I remove the backup approver", async function () {
  logger.info("Removing backup approver");
  await Profile.removeBackupApprover(this.page);
});

Then("the backup approver field should show {string}", async function (text) {
  logger.info("Verifying backup approver placeholder", { text });
  await Profile.verifyBackupApproverPlaceholder(this.page, text);
});

// --- Display preference steps ---

// Selects only — the Personal Details form persists on Save, so scenarios pair this with
// "I save the personal details".
When("I set the time format to {string} in my profile", async function (timeFormat) {
  logger.info("Setting the time format in the user profile", { timeFormat });
  await Profile.setTimeFormat(this.page, timeFormat);
});

When("I save the personal details", async function () {
  logger.info("Saving Personal Details form");
  await Profile.savePersonalDetails(this.page);
});

// --- Travel Preferences steps ---

Then("the Personal Details tab should be active showing the {string} field label", async function (fieldName) {
  logger.info("Verifying Personal Details tab is active with field label", { fieldName });
  await Profile.verifyPersonalDetailsTabActive(this.page, fieldName);
});

When("I open the traveler profile from the traveler name", async function () {
  logger.info("Opening traveler profile from traveler name link");
  const newPage = await Profile.openTravelerProfileFromName(this.page);
  this.page = newPage;
});

When("I open the travel preferences tab in my profile", async function () {
  logger.info("Opening Travel Preferences tab in user profile");
  await Profile.openTravelPreferencesTab(this.page);
});

When("I select a seat preference from the dropdown", async function () {
  logger.info("Selecting seat preference from dropdown");
  await Profile.selectSeatPreference(this.page);
});

When("I save the travel preferences", async function () {
  logger.info("Saving Travel Preferences form");
  await Profile.saveTravelPreferences(this.page);
});

Then("the seat preference should be saved", async function () {
  logger.info("Verifying seat preference is saved");
  await Profile.verifySeatPreferenceSaved(this.page);
});

When("I clear the seat preference selection", async function () {
  logger.info("Clearing seat preference selection");
  await Profile.clearSeatPreference(this.page);
});

Then("the seat preference should be cleared", async function () {
  logger.info("Verifying seat preference is cleared");
  await Profile.verifySeatPreferenceCleared(this.page);
});

// --- Dynamic Fields steps ---

Then("no dynamic field warning messages should be displayed", async function () {
  logger.info("Verifying no dynamic field warning messages are displayed");
  await Profile.verifyNoDynamicFieldWarnings(this.page);
});

Then("the dynamic profile field should show value {string}", async function (expectedValue) {
  logger.info("Verifying dynamic profile field value", { expectedValue });
  await Profile.verifyDynamicFieldValue(this.page, expectedValue);
});

Then("the dynamic profile field is not editable in the profile", async function () {
  logger.info("Verifying dynamic profile field is not editable in the profile");
  await Profile.verifyDynamicFieldNotEditable(this.page);
});

When("I open the personal details tab in my profile", async function () {
  logger.info("Opening personal details tab in profile");
  await Profile.openPersonalDetailsTab(this.page);
});

When("I scroll to the dynamic reference fields section", async function () {
  logger.info("Scrolling to dynamic reference fields section");
  await Profile.scrollToDynamicFields(this.page);
});

When("I hover over the dynamic field info icon", async function () {
  logger.info("Hovering over dynamic field info icon");
  await Profile.hoverDynamicFieldIcon(this.page);
});

Then("the tooltip should display {string}", async function (expectedText) {
  logger.info("Verifying tooltip text", { expectedText });
  await Profile.verifyTooltipText(this.page, expectedText);
});

// --- Loyalty number masking steps ---

When("I open the frequent programs tab in the traveler profile", async function () {
  logger.info("Opening frequent programs tab in traveler profile");
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.openFrequentProgramsTab(targetPage);
});

Then("the FQTV loyalty numbers should be masked showing only the last 3 digits", async function () {
  logger.info("Verifying FQTV loyalty numbers are masked");
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.verifyLoyaltyNumbersMasked(targetPage);
});

Then("I should see a masked loyalty number ending in {string}", async function (lastDigits) {
  logger.info("Verifying masked loyalty number ending", { lastDigits });
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.verifyMaskedLoyaltyEnding(targetPage, lastDigits);
});

// --- Mandatory field popup steps ---

Then("the profile popup should display {string} as a mandatory field", async function (fieldName) {
  logger.info("Verifying mandatory field in profile popup", { fieldName });
  await Profile.verifyMandatoryFieldPopup(this.page, fieldName);
});

When("I try to save the profile popup with empty mandatory fields", async function () {
  logger.info("Clicking Save in profile popup to trigger validation");
  await Profile.trySaveProfilePopup(this.page);
});

Then("I should see the validation message {string}", async function (message) {
  logger.info("Verifying validation message in profile popup", { message });
  await Profile.verifyValidationMessage(this.page, message);
});

Then("I should see the message {string}", async function (message) {
  logger.info("Verifying info message in profile popup", { message });
  await Profile.verifyInfoMessage(this.page, message);
});

When("I enter a mobile number in the profile popup with country code {string} area code {string} and number {string}", async function (countryCode, areaCode, number) {
  logger.info("Entering mobile number in profile popup", { countryCode, areaCode, number });
  await Profile.enterMobileInPopup(this.page, { countryCode, areaCode, number });
});

// --- Mandate fields per profile privilege (ADO US 60526) ---
// The editable profile dialog and the "Mandatory Details Are Missing" warning are the two
// mutually exclusive outcomes of selecting a traveller with missing mandate fields. Which one
// appears depends on the booker's profile privileges and on whether the traveller is themself,
// so every scenario asserts the expected popup AND the absence of the other one.

Then("the user profile popup is displayed", async function () {
  logger.info("Verifying the editable User profile popup opened");
  await Profile.verifyUserProfilePopupOpen(this.page);
});

Then("the user profile popup is not displayed", async function () {
  logger.info("Verifying the editable User profile popup did not open");
  await Profile.verifyUserProfilePopupNotOpen(this.page);
});

Then("the mandatory details are missing popup is displayed", async function () {
  logger.info("Verifying the Mandatory Details Are Missing popup opened");
  await Profile.verifyMandatoryDetailsWarningOpen(this.page);
});

Then("the mandatory details are missing popup is not displayed", async function () {
  logger.info("Verifying the Mandatory Details Are Missing popup did not open");
  await Profile.verifyMandatoryDetailsWarningNotOpen(this.page);
});

Then("the mandatory details are missing popup states {string}", async function (expectedText) {
  logger.info("Verifying the warning popup wording", { expectedText });
  await Profile.verifyMandatoryDetailsWarningText(this.page, expectedText);
});

Then("the {string} field is marked with a red star", async function (fieldName) {
  logger.info("Verifying the mandate field is starred in the profile popup", { fieldName });
  if (fieldName !== "Date of Birth") {
    throw new Error(
      `[profile.steps] Only "Date of Birth" is supported by this step, got "${fieldName}". ` +
      "personal-details-form.vue stars most labels unconditionally; Date of Birth is the one label " +
      "bound to the mandate-field configuration, so it is the only meaningful assertion target. " +
      "Add a dedicated page/DSL helper before extending this step to another field.",
    );
  }
  await Profile.verifyDateOfBirthMarkedAsMandatory(this.page);
});

Then("the user profile popup opens on the {string} tab", async function (tabName) {
  logger.info("Verifying which tab the profile popup opened on", { tabName });
  await Profile.verifyUserProfilePopupActiveTab(this.page, tabName);
});

Then("the user profile popup is editable", async function () {
  logger.info("Verifying the profile popup can be edited and saved");
  await Profile.verifyUserProfilePopupEditable(this.page);
});
When("I close the user profile popup", async function () {
  logger.info("Closing the User profile popup without saving");
  await Profile.closeUserProfilePopup(this.page);
});

When("I close the mandatory details are missing popup", async function () {
  logger.info("Closing the Mandatory Details Are Missing popup");
  await Profile.closeMandatoryDetailsWarning(this.page);
});

// ADO 83279 compares the warning wording between my own incomplete profile and another
// traveller's. The two popups only exist one at a time, so the first one's wording is carried on
// the World until the second opens.
When("I remember the mandatory details are missing popup wording", async function () {
  this.storedMandatoryDetailsWarningText = await Profile.captureMandatoryDetailsWarningText(this.page);
  logger.info("Stored the warning popup wording", { wording: this.storedMandatoryDetailsWarningText });
});

Then("the mandatory details are missing popup wording is identical to the one remembered earlier", async function () {
  if (!this.storedMandatoryDetailsWarningText) {
    throw new Error(
      "No warning popup wording was remembered — run \"I remember the mandatory details are missing popup wording\" " +
      "on the first popup before comparing against it.",
    );
  }
  logger.info("Comparing the warning popup wording against the remembered one", {
    remembered: this.storedMandatoryDetailsWarningText,
  });
  await Profile.verifyMandatoryDetailsWarningTextMatches(this.page, this.storedMandatoryDetailsWarningText);
});

// Clicking a traveller's name is NOT the same interaction as the mandate-fields popup above:
// trip-traveler-tag.vue routes to /user/:userId in a new tab instead of opening a dialog, so the
// three steps below are page-scoped while the "user profile popup" steps stay dialog-scoped.
// this.page is repointed at the new tab (same convention as "I open the traveler profile from the
// traveler name") so the remaining assertions — and the After hook's failure screenshot — target
// the profile that was just opened.
When("I click the traveler name on the search page", async function () {
  logger.info("Opening the last added traveller's profile from their name tag on the search page");
  this.page = await Profile.openTravelerProfileFromLastTravelerTag(this.page);
});

Then("the traveler profile page is displayed", async function () {
  logger.info("Verifying the standalone traveller profile page opened");
  await Profile.verifyTravelerProfilePageOpen(this.page);
});

Then("the traveler profile page is not editable", async function () {
  logger.info("Verifying the traveller profile page is read-only");
  await Profile.verifyTravelerProfilePageNotEditable(this.page);
});
