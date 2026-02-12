/**
 * Search Step Definitions
 *
 * Maps Gherkin steps to Search DSL methods for traveler management.
 * Search DSL handles adding travelers and managing traveler data.
 *
 * ===== STEP CATALOG =====
 *
 * Given Steps:
 *   "I have added myself as the traveler"
 *     → Search.addMeAsTraveler(page)
 *
 *   "I have added traveler by name {string}"
 *     → Search.addTravelerByName(page, travelerName)
 *
 *   "I have added a random guest traveler"
 *     → Search.addRandomGuest(page)
 *
 * ========================
 */

require("module-alias/register");

const { Given, setDefaultTimeout } = require("@cucumber/cucumber");
const { Search } = require("@dsl");

setDefaultTimeout(120000);

// ===== GIVEN STEPS =====

Given("I have added myself as the traveler", async function () {
  console.log("Adding traveler: I am the traveler");
  await Search.addMeAsTraveler(this.page);
});

Given("I have added traveler by name {string}", async function (travelerName) {
  console.log(`Adding traveler by name: ${travelerName}`);
  await Search.addTravelerByName(this.page, travelerName);
});

Given("I have added a random guest traveler", async function () {
  console.log("Adding random guest traveler");
  const result = await Search.addRandomGuest(this.page);
  console.log(`Guest added: ${result.guestData.firstName} ${result.guestData.lastName}`);
});
