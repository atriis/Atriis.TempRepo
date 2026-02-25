/**
 * Amtrak Results Step Definitions
 *
 * Maps Gherkin steps to AmtrakResults DSL methods for Amtrak result interactions.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I click more details for the first Amtrak result"
 *     → AmtrakResultsPage.clickMoreDetailsButton()
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { getPageObject } = require("@utils/pageObjectCache");
const AmtrakResultsPage = require("@pages/AmtrakResultsPage");
const logger = require("@utils/logger").child("AmtrakResults");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I click more details for the first Amtrak result", async function () {
  logger.info("Clicking more details for first Amtrak result");
  const amtrakResultsPage = getPageObject(this.page, AmtrakResultsPage);
  await amtrakResultsPage.clickMoreDetailsButton();
});
