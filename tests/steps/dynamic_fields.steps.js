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

When("I select the trip purpose as {string} and proceed", async function (option) {
  logger.info(`Selecting trip purpose as "${option}" and proceeding`);
  await DynamicAndReferenceFields.selectTripPurposeAndProceed(this.page, option);
});

// ===== REFERENCE FIELD VALIDATION STEPS =====

Then("the reference fields popup should show the following labels:", async function (dataTable) {
  const labels = dataTable.raw().map(row => row[0]);
  logger.info("Verifying reference field labels are visible", { labels });
  const result = await DynamicAndReferenceFields.verifyReferenceFieldLabelsVisible(this.page, labels);
  const missing = result.results.filter(r => !r.visible).map(r => r.label);
  if (missing.length > 0) {
    throw new Error(`Reference field labels not visible: ${missing.join(', ')}`);
  }
});

Then("the reference fields should have the following values:", async function (dataTable) {
  const pairs = dataTable.hashes().map(row => ({ label: row.field, expectedValue: row.value }));
  logger.info("Verifying reference field values", { pairs });
  const result = await DynamicAndReferenceFields.verifyReferenceFieldValues(this.page, pairs);
  const mismatches = result.results.filter(r => !r.match);
  if (mismatches.length > 0) {
    const details = mismatches.map(m => `"${m.label}": expected "${m.expected}", got "${m.actual}"`).join('; ');
    throw new Error(`Reference field value mismatches: ${details}`);
  }
});

Then("the following reference fields should not be editable:", async function (dataTable) {
  const labels = dataTable.raw().map(row => row[0]);
  logger.info("Verifying reference fields are not editable", { labels });
  const result = await DynamicAndReferenceFields.verifyReferenceFieldsNotEditable(this.page, labels);
  const editable = result.results.filter(r => !r.disabled).map(r => r.label);
  if (editable.length > 0) {
    throw new Error(`Reference fields should not be editable but are: ${editable.join(', ')}`);
  }
});

Then("clicking proceed should show a mandatory field validation error", async function () {
  logger.info("Clicking proceed to verify mandatory field validation error");
  const errorVisible = await DynamicAndReferenceFields.clickProceedAndVerifyMandatoryError(this.page);
  if (!errorVisible) {
    throw new Error("Expected a mandatory field validation error after clicking Proceed, but none was shown");
  }
});
