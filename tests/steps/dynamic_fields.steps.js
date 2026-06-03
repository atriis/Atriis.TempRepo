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

When("I fill in the {string} reference field with {string}", async function (fieldName, value) {
  logger.info(`Filling checkout reference field "${fieldName}" with "${value}"`);
  await DynamicAndReferenceFields.fillCheckoutReferenceField(this.page, fieldName, value);
});

When("I select the first available financial reference", async function () {
  logger.info("Selecting the first available Financial Reference code");
  await DynamicAndReferenceFields.selectFirstFinancialReference(this.page);
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

When("I select the {string} reference field as {string} and proceed", async function (fieldName, optionText) {
  logger.info(`Selecting reference field "${fieldName}" as "${optionText}" and proceeding`);
  const result = await DynamicAndReferenceFields.selectReferenceFieldDropdownIfVisible(
    this.page, fieldName, optionText
  );
  if (!result.fieldFound) {
    throw new Error(`Reference field "${fieldName}" did not appear — expected it to be visible for this test flow`);
  }
});

// Expects the reference fields popup to be present — waits up to 15s and FAILS if it never appears.
// Use this when the popup is guaranteed to show (e.g., after adding to cart with mandatory reference fields).
// For an optional/soft click that won't fail, use: "I click proceed button if visible" (common.steps.js)
When("I click proceed on the reference fields popup", async function () {
  logger.info("Clicking Proceed button on reference fields popup");
  await DynamicAndReferenceFields.proceedThroughReferenceFieldsPopup(this.page);
});

// ===== FINANCIAL REFERENCE STEPS =====

Then("the financial reference dropdown should contain the following options:", async function (dataTable) {
  const expectedOptions = dataTable.raw().map((row) => row[0]);
  logger.info("Verifying financial reference dropdown contains expected options", { expectedOptions });
  await DynamicAndReferenceFields.verifyFinancialReferenceOptions(this.page, expectedOptions);
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

Then("the following checkout reference fields should be visible:", async function (dataTable) {
  const labels = dataTable.raw().map(row => row[0]);
  logger.info("Verifying checkout reference field labels are visible", { labels });
  const result = await DynamicAndReferenceFields.verifyCheckoutReferenceFieldLabelsVisible(this.page, labels);
  const missing = result.results.filter(r => !r.visible).map(r => r.label);
  if (missing.length > 0) {
    throw new Error(`Checkout reference field labels not visible: ${missing.join(', ')}`);
  }
});

Then("the following checkout reference fields should not be visible:", async function (dataTable) {
  const labels = dataTable.raw().map(row => row[0]);
  logger.info("Verifying checkout reference field labels are hidden", { labels });
  const result = await DynamicAndReferenceFields.verifyCheckoutReferenceFieldLabelsNotVisible(this.page, labels);
  const visible = result.results.filter(r => r.visible).map(r => r.label);
  if (visible.length > 0) {
    throw new Error(`Checkout reference field labels should be hidden but are visible: ${visible.join(', ')}`);
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

// Selects a dropdown option for a reference field WITHOUT clicking Proceed.
// Use when filling multiple fields before a single Proceed click.
// For a single-field flow that auto-proceeds, use: "I select the {string} reference field as {string} and proceed"
When("I select the {string} reference field as {string}", async function (fieldName, optionText) {
  logger.info(`Selecting reference field dropdown "${fieldName}" as "${optionText}" (no proceed)`);
  await DynamicAndReferenceFields.selectReferenceFieldDropdownOnly(this.page, fieldName, optionText);
});

Then("clicking proceed should show a mandatory field validation error", async function () {
  logger.info("Clicking proceed to verify mandatory field validation error");
  const errorVisible = await DynamicAndReferenceFields.clickProceedAndVerifyMandatoryError(this.page);
  if (!errorVisible) {
    throw new Error("Expected a mandatory field validation error after clicking Proceed, but none was shown");
  }
});
