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
});

Given("I have added traveler by name {string}", async function (travelerName) {
  logger.info("Adding traveler by name", { travelerName });
  const result = await Search.addTravelerByName(this.page, travelerName);
  expect(result.starIconVisible, "Star icon should be visible after adding traveler by name").toBe(true);
});

Given("I have added a random guest traveler", async function () {
  logger.info("Adding random guest traveler");
  const result = await Search.addRandomGuest(this.page);
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
});

Given("I have added a random guest traveler with name {string} {string}", async function (firstName, lastName) {
  logger.info("Adding random guest traveler with custom name", { firstName, lastName });
  const result = await Search.addRandomGuestWithName(this.page, firstName, lastName);
  expect(result.added, "Guest traveler should be added").toBe(true);
  this.guestTravelerCount = (this.guestTravelerCount ?? 0) + 1;
  this.selectedTravelerCount = result.selectedTravelerCount;
});

When("I open the traveler drawer", async function () {
  throw new Error("TODO: implement 'I open the traveler drawer' — open traveler section from search page");
});

When("I click add guest traveler", async function () {
  throw new Error("TODO: implement 'I click add guest traveler' — click add guest traveler button in traveler drawer");
});

Then("the gender field should display Please select gender", async function () {
  throw new Error("TODO: implement 'the gender field should display Please select gender' — validate guest gender dropdown placeholder text");
});

When("I close the guest traveler dialog", async function () {
  throw new Error("TODO: implement 'I close the guest traveler dialog' — close add guest popup/dialog");
});

Given("I add a third traveler named {string}", async function (travelerName) {
  throw new Error(`TODO: implement 'I add a third traveler named {string}' — add an additional traveler named ${travelerName}`);
});
