/**
 * Hotel Level Results Step Definitions
 *
 * Maps Gherkin steps to HotelLevelResults DSL methods.
 *
 * ===== STEP CATALOG =====
 *
 * Selection:
 *   "I select the first available hotel"
 *
 * ========================
 */

require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { HotelLevelResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("HotelResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SELECTION
// ========================================

When("I select the first available hotel", async function () {
  logger.info("Selecting first hotel option");
  await HotelLevelResults.clickFirstHotelOption(this.page);
});
