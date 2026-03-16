require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { DynamicAndReferenceFields } = require("../../src/dsl");
const logger = require("@utils/logger").child("DynamicFields");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I select the trip purpose reference field", async function () {
  logger.info("Selecting trip purpose reference field");
  await DynamicAndReferenceFields.selectTripPurposeReferenceField(this.page);
});

When("I add a number checkout field", async function () {
  logger.info("Adding number checkout field");
  await DynamicAndReferenceFields.addNumberCheckoutField(this.page);
});

When("I wait for booking details in checkout", async function () {
  logger.info("Waiting for booking details heading in checkout page");
  await DynamicAndReferenceFields.waitForCheckoutBookingDetails(this.page);
});

When("I fill in the {string} reference field with {string}", async function (fieldName, value) {
  logger.info(`Filling checkout reference field "${fieldName}" with "${value}"`);
  await DynamicAndReferenceFields.fillCheckoutReferenceField(this.page, fieldName, value);
});

When("I fill in NL reference fields education and courses", async function () {
  logger.info("Selecting NL reference field: Type of Trip → EDUCATION (with 10s timeout)");
  const result = await DynamicAndReferenceFields.selectReferenceFieldDropdownIfVisible(
    this.page, "Type of Trip", "EDUCATION"
  );
  if (result.fieldFound) {
    logger.info("NL reference field found and filled successfully");
  } else {
    logger.info("NL reference field did not appear within timeout — proceeding without error");
  }
});
