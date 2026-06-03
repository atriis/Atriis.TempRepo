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

// ===== THEN STEPS =====

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

Given("I add a third traveler named {string}", async function (travelerName) {
  throw new Error(`TODO: implement 'I add a third traveler named {string}' — add an additional traveler named ${travelerName}`);
});
