/**
 * Hotel Search Step Definitions
 *
 * Maps Gherkin steps to HotelSearch DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Search:
 *   "I search for a hotel in {string} for {int} night(s)"
 *
 * ========================
 */

require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { HotelSearch } = require("../../src/dsl");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SEARCH
// ========================================

When("I search for a hotel in {string} for {int} night(s)", async function (location, nights) {
  console.log(`Searching for hotel in ${location} for ${nights} night(s)`);
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights: nights });
});
