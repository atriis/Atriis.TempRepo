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

// --- Header profile menu steps ---

// Unlike "I navigate to my user profile", this stops with the dropdown OPEN so the following
// Then steps can read what the user's privileges actually put in it.
When("I click my user initials in the header", async function () {
  logger.info("Opening the header profile menu from the user initials");
  await Profile.openProfileMenu(this.page);
});

Then("the {string} option should be displayed in the profile menu", async function (optionName) {
  logger.info("Verifying the profile menu option is displayed", { optionName });
  await Profile.verifyProfileMenuOptionVisible(this.page, optionName);
});

Then("the {string} option should not be displayed in the profile menu", async function (optionName) {
  logger.info("Verifying the profile menu option is not displayed", { optionName });
  await Profile.verifyProfileMenuOptionNotVisible(this.page, optionName);
});

// Clicks the entry in the already-open dropdown - re-clicking the avatar trigger (as
// "I navigate to my user profile" does) would toggle the menu shut. Opens a new tab, so the
// active page reference moves with it.
//
// Single owner of this phrase for every menu entry, "Manage profiles" included: two definitions
// of the same pattern would make the step ambiguous for every scenario in the suite.
When("I open {string} from the profile menu", async function (optionName) {
  logger.info("Opening an option from the already-open profile menu", { optionName });
  // requireNewTab: these scenarios all run at a desktop viewport, where openInNewTab always opens
  // one. Falling back to the current page there would only hide a swallowed click.
  this.page = await Profile.openProfileMenuOptionInNewTab(this.page, optionName, { requireNewTab: true });
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

// AB#83252 expired-card indicator. Deliberately a separate step from the one below so the dot can be
// asserted while a DIFFERENT tab is active — "visible regardless of which tab is active" is the
// criterion, so this must run BEFORE "I open the form of payment tab in my profile".
Then("a red dot indicator should be displayed on the {string} profile tab", async function (tabName) {
  logger.info("Verifying the expired-card red dot on a profile tab", { tabName });
  await Profile.verifyExpiredCardDotOnTab(this.page, tabName);
});

Then("the credit card {string} should be marked as {string} in the form of payment list", async function (cardName, expectedLabel) {
  logger.info("Verifying a stored card carries the expired label", { cardName, expectedLabel });
  await Profile.verifyCardMarkedExpired(this.page, cardName, expectedLabel);
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

// Leaves the dropdown open so the following order assertion reads its options (test 85524).
When("I open the {string} dropdown in my profile", async function (fieldLabel) {
  logger.info("Opening Personal Details dropdown", { fieldLabel });
  await Profile.openPersonalDetailsDropdown(this.page, fieldLabel);
});

Then("the {string} dropdown options in my profile should be sorted alphabetically", async function (fieldLabel) {
  logger.info("Verifying Personal Details dropdown options are sorted alphabetically", { fieldLabel });
  await Profile.verifyPersonalDetailsDropdownSortedAlphabetically(this.page, fieldLabel);
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

When("I reload my profile on the travel preferences tab", async function () {
  logger.info("Reloading the profile on the Travel Preferences tab");
  this.mealCatalog = await Profile.reloadProfileOnTravelPreferencesTab(this.page);
});

When("I open the meal type dropdown in my travel preferences", async function () {
  logger.info("Opening the Meal type dropdown");
  await Profile.openMealTypeDropdown(this.page);
});

When("I select the {string} meal type in my travel preferences", async function (mealLabel) {
  logger.info("Selecting meal type", { mealLabel });
  await Profile.selectMealType(this.page, mealLabel);
});

Then("the meal type in my travel preferences should be {string}", async function (mealLabel) {
  logger.info("Verifying meal type", { mealLabel });
  await Profile.verifyMealType(this.page, mealLabel);
});

Then("the meal type options should be the meals catalog in the same order", async function () {
  logger.info("Verifying meal type options match the meals catalog");
  await Profile.verifyMealTypeOptionsMatchCatalog(this.page, this.mealCatalog);
});

Then("{string} should be the first meal type option", async function (mealLabel) {
  logger.info("Verifying the first meal type option", { mealLabel });
  await Profile.verifyFirstMealTypeOption(this.page, mealLabel);
});

Then("the meal type options should include:", async function (dataTable) {
  const mealLabels = dataTable.raw().map((row) => row[0]);
  logger.info("Verifying meal type options include", { mealLabels });
  await Profile.verifyMealTypeOptionsInclude(this.page, mealLabels);
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

// --- DOB / passport encryption steps (35195) ---
// All three are activePage-scoped: "I open the traveler profile for" opens the other user's
// profile in a NEW TAB and parks it on this.activePage, so the trip page (this.page) is the wrong
// target. That is also why the Passports & Visas tab needs its own phrase here rather than
// reusing "...in my profile", which is bound to this.page.

When("I open the passports and visas tab in the traveler profile", async function () {
  logger.info("Opening Passports & Visas tab in traveler profile");
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.openPassportsAndVisasTab(targetPage);
});

Then("the birth date should be encrypted in the traveler profile", async function () {
  logger.info("Verifying the birth date is encrypted in the traveler profile");
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.verifyBirthDateEncrypted(targetPage);
});

Then("the passport number should be encrypted showing only the last 3 digits", async function () {
  logger.info("Verifying the passport number is encrypted with only the last 3 digits visible");
  const targetPage = this.activePage || this.profilePage || this.page;
  await Profile.verifyPassportNumberEncrypted(targetPage);
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

// Identity-scoped variant of the step above. Kept separate rather than folded into it with an
// optional parameter, because the two assert different things: the plain step is used where the
// popup can only be the booker's own, this one where a traveller was selected and opening the
// booker's own profile instead is the regression being guarded against.
Then("the user profile popup is displayed for {string}", async function (travelerEmail) {
  logger.info("Verifying the editable User profile popup opened for the selected traveller", { travelerEmail });
  await Profile.verifyUserProfilePopupBelongsTo(this.page, travelerEmail);
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
  // Recorded before this.page is repointed: the trip page is otherwise unreachable by name, and
  // "I close the traveler profile tab and return to the search page" needs it to come back to the
  // right tab. Reading it back out of context.pages() instead would be a guess in a scenario that
  // opens several profiles in turn.
  this.travelerProfileOpenerPage = this.page;
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
// Identity check for the page the step above opened. The privilege scenarios open one traveller's
// profile after another, and the failure they exist to catch — the tag routing to the BOOKER's
// /user/:userId — renders a perfectly valid profile page, so "the traveler profile page is
// displayed" cannot tell it apart. Named by first name because that is the term the traveller was
// searched with; the full-name heading check lives in "I should see the heading {string}".
Then("the traveler profile page belongs to {string}", async function (expectedFirstName) {
  logger.info("Verifying whose traveller profile opened", { expectedFirstName });
  await Profile.verifyTravelerProfilePageBelongsTo(this.page, expectedFirstName);
});

// The value is generated in the DSL and stored on the World, so the read-back step below asserts
// the exact string that was typed rather than "something changed" — a save that silently kept the
// old value would satisfy the looser check on any profile that already had a middle name.
When("I enter a random middle name in the traveler profile", async function () {
  logger.info("Entering a random middle name in the open traveller profile");
  const { value } = await Profile.enterRandomMiddleName(this.page);
  this.enteredMiddleName = value;
});

Then("the middle name in the traveler profile should be the value I entered", async function () {
  logger.info("Verifying the middle name was saved", { expectedValue: this.enteredMiddleName });
  await Profile.verifyMiddleName(this.page, this.enteredMiddleName);
});

// Undoes "I click the traveler name on the search page": closes the profile tab and repoints
// this.page back at the trip it was opened from, so the next traveller's profile is opened from a
// live search page and the After hook screenshots the trip on failure.
When("I close the traveler profile tab and return to the search page", async function () {
  logger.info("Closing the traveller profile and returning to the search page");
  if (!this.travelerProfileOpenerPage) {
    throw new Error(
      'No search page was recorded to return to. This step must follow "I click the traveler name on ' +
      'the search page", which is what stores the page the profile was opened from.'
    );
  }
  this.page = await Profile.closeTravelerProfileAndReturn(this.page, this.travelerProfileOpenerPage);
  this.travelerProfileOpenerPage = null;
});

// Gender rather than a generic "a required field" assertion: the popup prints the same wording
// under every empty mandatory field, so naming the field is what proves the mandate rule was
// applied to the one the traveller is actually missing.
Then("the gender field shows the required-field error {string}", async function (expectedMessage) {
  logger.info("Verifying the Gender select shows the required-field error", { expectedMessage });
  await Profile.verifyGenderRequiredError(this.page, expectedMessage);
});

// Negative counterpart of "I click the traveler name on the search page". For a traveller the
// booker may not view, the tag is not a link at all, so this cannot be split into a click step and
// an assertion step: the click having no effect IS the assertion, and the click step above would
// time out on the is-clickable class the tag deliberately lacks.
Then("the traveler name {string} on the search page should not be clickable", async function (name) {
  logger.info("Verifying the traveller name offers no route to their profile", { name });
  await Profile.verifyTravelerNameTagNotClickable(this.page, name);
});

// Landing check for a profile deep link that names its section — today the document-expiry
// warnings' "Update Passport" / "Update Visa" buttons (AB#65307), which open
// /user/:userId?tab=passportsAndVisas in a new tab. Page-scoped, like the three steps above, and
// deliberately NOT with the document-expiry steps in common.steps.js: what is asserted here is
// the profile screen.
//
// Two variants, because whose profile opened only matters on one of the two surfaces. A warning on
// the traveller's own homepage can only ever open their own profile, so naming them would assert
// nothing. A warning on a booker's trip search screen belongs to a SELECTED traveller, and "a
// profile opened on the right tab" is satisfied just as well by the booker's own — which is the
// bug the named variant exists to catch.
Then(
  "the user profile should open in a new tab on the passports and visas section",
  async function () {
    logger.info("Verifying the profile opened on the passports and visas section");
    await Profile.verifyUserProfileOpenOnTab(this.page, "passportsAndVisas");
  }
);

Then(
  "the user profile of {string} should open in a new tab on the passports and visas section",
  async function (travellerName) {
    logger.info("Verifying whose profile opened, and on which tab", { travellerName });
    await Profile.verifyUserProfileOpenOnTab(this.page, "passportsAndVisas", travellerName);
  }
);
