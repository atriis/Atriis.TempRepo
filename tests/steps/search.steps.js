require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { Search } = require("@dsl");
const { expect } = require("@playwright/test");
const logger = require("@utils/logger").child("Search");

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

Given("I have added myself as the traveler", async function () {
  logger.info("Adding traveler: I am the traveler");
  const result = await Search.addMeAsTraveler(this.page);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler").toBe(true);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

When("I click to add myself as the traveler", async function () {
  logger.info("Clicking Add me button (profile popup expected)");
  await Search.clickAddMeButton(this.page);
});

When("I add a traveler by name {string} from the search autocomplete", async function (name) {
  logger.info("Selecting traveler from autocomplete (profile popup expected)", { name });
  await Search.selectTravelerFromAutocomplete(this.page, name);
});

Then("the traveler {string} should not be available to add", async function (travelerName) {
  logger.info("Verifying traveler is not available to add", { travelerName });
  const available = await Search.isTravelerAvailableToAdd(this.page, travelerName);
  expect(
    available,
    `Expected traveler "${travelerName}" to NOT be available to add (outside the booker's permitted user group)`
  ).toBe(false);
});

Given("I have added traveler by name {string}", async function (travelerName) {
  logger.info("Adding traveler by name", { travelerName });
  const result = await Search.addTravelerByName(this.page, travelerName);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler by name").toBe(true);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler", async function () {
  logger.info("Adding random guest traveler");
  const result = await Search.addRandomGuest(this.page);
  expect(result.starIconVisible, "Star icon should be visible after adding guest").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with phone type {string}", async function (phoneType) {
  logger.info("Adding random guest traveler with phone type", { phoneType });
  const result = await Search.addRandomGuest(this.page, phoneType);
  expect(result.starIconVisible, "Star icon should be visible after adding guest").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

// ===== WHEN STEPS =====

When("I add an empty traveler slot", async function () {
  logger.info("Adding empty traveler slot (click add-traveler then close without selecting)");
  await Search.addEmptyTravelerSlot(this.page);
});

// Waits for BOTH traveller names to render on the search form before re-searching. After adding a
// guest the trip has two travellers (self + guest); the Search button stays enabled from the prior
// search, so it must not be clicked until the newly added (randomly named) guest is committed —
// otherwise the search runs without that traveller and its reference fields never load.
When("I wait for the traveler name to be displayed", async function () {
  logger.info("Waiting for both traveler names to be displayed on the search form");
  await Search.waitForTravelerNameDisplayed(this.page, 2);
});

// ===== THEN STEPS =====

Then("the traveler name {string} should be visible in the travelers list", async function (name) {
  logger.info("Verifying traveler name is visible in travelers list", { name });
  await Search.verifyTravelerNameVisible(this.page, name);
});

// Asserts the name shown next to the passenger icon on the traveler chip is accurate.
// The chip's name node (.trip-traveler-tag .traveler-name.black) is the name beside the icon,
// so reusing verifyTravelerNameVisible confirms the added traveler is exactly this name.
Then("the traveler name {string} is added successfully", async function (name) {
  logger.info("Verifying traveler name next to the passenger icon is accurate", { name });
  await Search.verifyTravelerNameVisible(this.page, name);
});

Then("the selected traveler should be {string} by default", async function (name) {
  logger.info("Verifying traveler is preselected by default", { name });
  await Search.verifyTravelerNameVisible(this.page, name);
});

Then("the star icon should be visible", async function () {
  logger.info("Verifying star icon is visible in travelers section");
  await Search.assertStarIconVisible(this.page);
});

Then("it should not be possible to add more travelers", async function () {
  logger.info("Verifying add-traveler controls are hidden (DisableBookForMultiPax permission)");
  await Search.verifyCannotAddMoreTravelers(this.page);
});

Then("only the empty traveler slot should be highlighted in red", async function () {
  logger.info("Verifying only the empty traveler slot is highlighted and named travelers are not in red");
  await Search.verifyOnlyEmptyTravelerSlotIsRed(this.page);
});

Then("the search title should contain {string}", async function (expectedText) {
  logger.info("Validating search title contains text", { expectedText });
  await Search.validateSearchTitleContains(this.page, expectedText);
});

Then("I remove myself as the traveler", async function () {
  logger.info("Removing traveler: I am the traveler");
  const result = await Search.removeTraveler(this.page);
  expect(result.removed, "Traveler should be removed").toBe(true);
});

Given("I have added {string} as primary traveler", async function (travelerName) {
  logger.info("Adding traveler as primary by name", { travelerName });
  const result = await Search.addTravelerAsPrimaryByName(this.page, travelerName);
  expect(result.starIconVisible, "Star icon should be visible after adding primary traveler").toBe(true);
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with name {string} {string}", async function (firstName, lastName) {
  logger.info("Adding random guest traveler with custom name", { firstName, lastName });
  const result = await Search.addRandomGuestWithName(this.page, firstName, lastName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with email {string}", async function (email) {
  logger.info("Adding random guest traveler with fixed email", { email });
  const result = await Search.addRandomGuestWithEmail(this.page, email);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

async function addGuestWithNameAndEmailStep(world, fullName, email) {
  logger.info("Adding guest traveler with fixed name and email", { fullName, email });
  const result = await Search.addGuestWithNameAndEmail(world.page, fullName, email);
  expect(result.added, "Guest traveler should be added").toBe(true);
  world.guestTravelerCount = (world.guestTravelerCount ?? 0) + 1;
  world.selectedTravelerCount = result.selectedTravelerCount;
}

// Same underlying action (the "Add Traveller" widget/dialog is shared between the pre-search
// traveler bar and the cart page's own Travellers section — see Search.addGuestWithNameAndEmail),
// registered under two phrasings so scenarios read naturally at either point in the flow.
Given("I have added a guest traveler named {string} with email {string}", async function (fullName, email) {
  await addGuestWithNameAndEmailStep(this, fullName, email);
});

Given("I add guest traveller from cart named {string} with email {string}", async function (fullName, email) {
  await addGuestWithNameAndEmailStep(this, fullName, email);
});

Given("I have added a guest passenger without date of birth named {string} {string}", async function (firstName, lastName) {
  logger.info("Adding guest traveler without date of birth", { firstName, lastName });
  const result = await Search.addGuestWithoutDateOfBirth(this.page, firstName, lastName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with middle name {string}", async function (middleName) {
  logger.info("Adding random guest traveler with middle name", { middleName });
  const result = await Search.addRandomGuestWithMiddleName(this.page, middleName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler with spaces in the first name", async function () {
  logger.info("Adding random guest traveler with spaces in the first name");
  const result = await Search.addRandomGuestWithSpacesInFirstName(this.page);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Then("the traveler icon should be displayed", async function () {
  logger.info("Verifying traveler icon button is visible on new trip page");
  await Search.verifyTravelerIconDisplayed(this.page);
});

When("I click add traveller", async function () {
  logger.info("Clicking add traveller button to open edit-traveler dialog");
  await Search.clickAddTraveler(this.page);
});

Then("the traveler checkbox {string} should be visible", async function (labelText) {
  logger.info("Verifying traveler checkbox is visible", { labelText });
  await Search.verifyTravelerCheckboxVisible(this.page, labelText);
});

When("I open the traveler drawer", async function () {
  throw new Error("TODO: implement 'I open the traveler drawer' — open traveler section from search page");
});

When("I click add guest traveler", async function () {
  throw new Error("TODO: implement 'I click add guest traveler' — click add guest traveler button in traveler drawer");
});

When("I open the add guest traveler form", async function () {
  logger.info("Opening add guest traveler form");
  await Search.openAddGuestTravelerForm(this.page);
});

Then("the only available guest traveller type should be {string}", async function (expectedType) {
  logger.info("Verifying the guest form offers only one traveller type", { expectedType });
  await Search.verifyOnlyGuestPassengerType(this.page, expectedType);
});

When("I open the date of birth picker for the guest traveler", async function () {
  logger.info("Opening DOB picker in guest traveler form");
  await Search.openGuestDobPicker(this.page);
});

Then("the date of birth picker should show the year restricted to {int} years ago", async function (minAge) {
  logger.info("Verifying DOB picker year restriction", { minAge });
  await Search.verifyDobYearRestriction(this.page, minAge);
});

Then("the date picker should remain open for month selection", async function () {
  logger.info("Verifying DOB picker remains open in month selection mode");
  await Search.verifyDobPickerStillOpen(this.page);
});

Then("the gender field should display Please select gender", async function () {
  throw new Error("TODO: implement 'the gender field should display Please select gender' — validate guest gender dropdown placeholder text");
});

When("I close the guest traveler dialog", async function () {
  throw new Error("TODO: implement 'I close the guest traveler dialog' — close add guest popup/dialog");
});

Given("I have added a guest traveler {string} {string} with user group {string}", async function (firstName, lastName, userGroupName) {
  logger.info("Adding guest traveler with user group", { firstName, lastName, userGroupName });
  const result = await Search.addGuestWithUserGroup(this.page, firstName, lastName, userGroupName);
  expect(result.added, "Guest traveler should be added with user group").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

Given("I have added a random guest traveler not as primary with copying settings from the user group {string}", async function (userGroupName) {
  logger.info("Adding a random guest traveler (not primary) copying settings from the user group", { userGroupName });
  const result = await Search.addRandomGuestCopyingSettingsFromUserGroup(this.page, userGroupName);
  expect(result.added, "Random guest traveler should be added copying settings from user group").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

When("I select {string} as the copy settings for the guest", async function (settingsType) {
  logger.info("Selecting copy settings for guest traveler", { settingsType });
  await Search.selectGuestCopySettings(this.page, settingsType);
});

When("I fill in the guest details first name {string} last name {string} gender {string} email {string}", async function (firstName, lastName, gender, email) {
  logger.info("Filling in guest personal details", { firstName, lastName, gender, email });
  await Search.fillGuestDetails(this.page, firstName, lastName, gender, email);
});

When("I attempt to add the guest traveler", async function () {
  logger.info("Attempting to add guest traveler (triggering form validation)");
  await Search.attemptAddGuestTraveler(this.page);
});

Then("the user group field should be marked as mandatory for the guest", async function () {
  logger.info("Verifying user group field is mandatory");
  await Search.verifyUserGroupMandatory(this.page);
});

When("I select the passenger type {string} for the guest traveler", async function (passengerType) {
  logger.info("Selecting passenger type for guest traveler", { passengerType });
  await Search.selectGuestPassengerType(this.page, passengerType);
});

When("I fill in the guest traveler first name {string} and last name {string}", async function (firstName, lastName) {
  logger.info("Filling guest traveler name", { firstName, lastName });
  await Search.fillGuestName(this.page, firstName, lastName);
});

When("I fill in the guest traveler date of birth {string}", async function (dateOfBirth) {
  logger.info("Filling guest traveler date of birth", { dateOfBirth });
  await Search.fillGuestDateOfBirth(this.page, dateOfBirth);
});

When("I click the guest traveler email field", async function () {
  logger.info("Clicking guest traveler email field");
  await Search.clickGuestEmailField(this.page);
});

Then("the guest traveler email field should show the error {string}", async function (expectedError) {
  logger.info("Verifying guest traveler email field error", { expectedError });
  const actualError = await Search.getGuestEmailFieldError(this.page);
  expect(
    actualError,
    `Guest email field should show the error "${expectedError}", but got "${actualError}"`
  ).toContain(expectedError);
});

When("I fill in the guest traveler email {string}", async function (email) {
  logger.info("Filling guest traveler email", { email });
  await Search.fillGuestEmail(this.page, email);
});

When("I select the guest gender {string}", async function (gender) {
  logger.info("Selecting guest gender", { gender });
  await Search.selectGuestGender(this.page, gender);
});

When("I click the add guest button", async function () {
  logger.info("Clicking the add guest button");
  await Search.confirmAddGuest(this.page);
});

Then("the passenger type tag should display {string}", async function (passengerType) {
  logger.info("Verifying passenger type tag", { passengerType });
  const actualTag = await Search.getPassengerTypeTag(this.page);
  expect(
    actualTag,
    `Passenger type tag should display "${passengerType}", but got "${actualTag}"`
  ).toContain(passengerType);
});

Then("the search should display the message {string}", async function (message) {
  logger.info("Verifying search message is displayed", { message });
  const displayed = await Search.isSearchMessageDisplayed(this.page, message);
  expect(
    displayed,
    `Search should display the message "${message}", but it was not visible`
  ).toBe(true);
});

When("I click the request assistance icon", async function () {
  logger.info("Clicking the request assistance icon");
  await Search.clickRequestAssistanceIcon(this.page);
});

Then("the travelers section title should display {string}", async function (expectedTitle) {
  logger.info("Verifying travelers section title", { expectedTitle });
  const actualTitle = await Search.getTravelersSectionTitle(this.page);
  expect(
    actualTitle,
    `Travelers section title should display "${expectedTitle}", but got "${actualTitle}"`
  ).toContain(expectedTitle);
});

Given("I add a third traveler named {string}", async function (travelerName) {
  throw new Error(`TODO: implement 'I add a third traveler named {string}' — add an additional traveler named ${travelerName}`);
});

Given(
  /^I have added a random traveler from the list: (.+)$/,
  async function (nameList) {
    const names = nameList.split(",").map((n) => n.trim());
    const selectedName = names[Math.floor(Math.random() * names.length)];
    logger.info("Adding randomly selected traveler from list", { selectedName, nameList });
    const result = await Search.addTravelerByName(this.page, selectedName);
    expect(result.starIconVisible, "Star icon should be visible after adding traveler by name").toBe(true);
    this.selectedTravelerCount = result.selectedTravelerCount;
  }
);
