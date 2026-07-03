require("module-alias/register");
const { Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { ParallelSearch } = require("@dsl");
const logger = require("@utils/logger").child("ParallelSearch");

setDefaultTimeout(120000);

// ========================================
// THEN STEPS - PARALLEL SEARCH ASSERTIONS
// ========================================

Then("the rental car hours should match the flight hours", async function () {
  logger.info("Verifying rental car pick-up/drop-off hours match the flight hours");
  await ParallelSearch.verifyCarHoursMatchFlightHours(this.page);
});
