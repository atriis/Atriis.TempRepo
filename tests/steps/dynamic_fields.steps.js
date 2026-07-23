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

// Selects the mandatory reference field's option in the open reference-fields popup (expands its
// collapse-section, then commits the first el-select option). Best-effort: a "mandatory and blocked
// from editing" field is disabled, so nothing is selected and the following message assertion verifies
// the block persists (test 22924); an ordinary field is selected so Proceed advances (test 22928).
When("I select the mandatory reference field option in the popup", async function () {
  logger.info("Selecting the mandatory reference field option in the reference-fields popup");
  await DynamicAndReferenceFields.selectMandatoryReferenceFieldOptionInPopup(this.page);
});

// Expects the reference fields popup to be present — waits up to 15s and FAILS if it never appears.
// Use this when the popup is guaranteed to show (e.g., after adding to cart with mandatory reference fields).
// For an optional/soft click that won't fail, use: "I click proceed button if visible" (common.steps.js)
When("I click proceed on the reference fields popup", async function () {
  logger.info("Clicking Proceed button on reference fields popup");
  await DynamicAndReferenceFields.proceedThroughReferenceFieldsPopup(this.page);
});

// ===== FINANCIAL REFERENCE STEPS =====

// Opens (readies) the Financial Reference dropdown in the travel-request popup.
// The actual open/read/close is done by the following assertion step
// ("the financial reference dropdown should contain the following options") — this step only
// ensures the dropdown has rendered so that assertion can act on it.
When("I open the financial reference dropdown in the travel request popup", async function () {
  logger.info("Opening the financial reference dropdown in the travel request popup");
  await DynamicAndReferenceFields.openFinancialReferenceDropdown(this.page);
});

Then("the financial reference modal title should be {string}", async function (expectedTitle) {
  logger.info(`Verifying the Financial Reference modal title is "${expectedTitle}"`);
  await DynamicAndReferenceFields.verifyFinancialReferenceModalTitle(this.page, expectedTitle);
});

Then("the financial reference section should show a mandatory marker", async function () {
  logger.info("Verifying the Financial Reference section shows a mandatory marker");
  await DynamicAndReferenceFields.verifyFinancialReferenceMandatoryMarker(this.page);
});

Then("the financial reference dropdown should contain the following options:", async function (dataTable) {
  const expectedOptions = dataTable.raw().map((row) => row[0]);
  logger.info("Verifying financial reference dropdown contains expected options", { expectedOptions });
  await DynamicAndReferenceFields.verifyFinancialReferenceOptions(this.page, expectedOptions);
});

// ===== REFERENCE FIELD VALIDATION STEPS =====

Then("the travel request popup should show a reference section for traveler {string}", async function (travelerName) {
  logger.info(`Verifying the travel request popup shows a reference section for traveler "${travelerName}"`);
  await DynamicAndReferenceFields.verifyTravelerSectionHeader(this.page, travelerName);
});

Then("the reference fields popup should show the following labels:", async function (dataTable) {
  const labels = dataTable.raw().map(row => row[0]);
  logger.info("Verifying reference field labels are visible", { labels });
  const result = await DynamicAndReferenceFields.verifyReferenceFieldLabelsVisible(this.page, labels);
  const missing = result.results.filter(r => !r.visible).map(r => r.label);
  if (missing.length > 0) {
    throw new Error(`Reference field labels not visible: ${missing.join(', ')}`);
  }
});

Then("the request assistance reference fields are displayed in the following order:", async function (dataTable) {
  const expectedOrder = dataTable.raw().map(row => row[0]);
  logger.info("Verifying request-assistance reference fields display order", { expectedOrder });
  await DynamicAndReferenceFields.verifyReferenceFieldOrder(this.page, expectedOrder);
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

// Opens a checkout reference-field dropdown by its label and asserts it offers the given option
// display values — for tests verifying a field "displays value from Option, not the GDS output code"
// (test 54444). These are dropdown OPTIONS, not field labels or selected values, so the label/value
// verifiers above cannot find them.
Then("the checkout reference field dropdown {string} contains the options:", async function (fieldName, dataTable) {
  const options = dataTable.raw().map(row => row[0]);
  logger.info("Verifying checkout reference field dropdown options", { fieldName, options });
  const result = await DynamicAndReferenceFields.verifyCheckoutReferenceFieldDropdownOptions(this.page, fieldName, options);
  const missing = result.results.filter(r => !r.present).map(r => r.option);
  if (missing.length > 0) {
    throw new Error(`Dropdown "${fieldName}" is missing expected options: ${missing.join(', ')}`);
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

// Selects the first available option for a mandatory reference field WITHOUT clicking Proceed.
// Use when the field's configured options vary per corporate profile and the test only needs a
// valid value to proceed. Follow with "I click proceed on the reference fields popup".
When("I select the first available option for the {string} reference field", async function (fieldName) {
  logger.info(`Selecting the first available option for reference field "${fieldName}" (no proceed)`);
  const result = await DynamicAndReferenceFields.selectFirstReferenceFieldOption(this.page, fieldName);
  logger.info(`Selected reference field option`, { fieldName, selectedOption: result?.selectedOption });
});

// Fills a TEXT reference field in the search-gating reference-fields popup by its label (as written in
// the feature, e.g. "* Custom Regular Expression 1"). Blurs after filling so a custom-regex validation
// fires on entry. Follow with the validation-error / message assertion steps below.
When("I fill {string} reference field pop up with {string}", async function (fieldName, value) {
  logger.info(`Filling reference field "${fieldName}" in the popup with "${value}"`);
  await DynamicAndReferenceFields.fillPopupReferenceField(this.page, fieldName, value);
});

// Verifies a validation error is shown on the Nth reference field (1-based) in the popup — e.g. the
// custom regular-expression validation rejected the entered value.
Then("a validation error is displayed on the {string} pop up reference field", async function (index) {
  logger.info(`Verifying a validation error is displayed on popup reference field "${index}"`);
  await DynamicAndReferenceFields.verifyValidationErrorOnPopupReferenceField(this.page, index);
});

// Verifies a message is displayed in the reference-fields popup — e.g. the mandatory-information
// instruction that stays visible after clicking Proceed with invalid/missing values.
Then("the message {string} is displayed in the pop up reference field", async function (message) {
  logger.info(`Verifying the message "${message}" is displayed in the reference-fields popup`);
  await DynamicAndReferenceFields.verifyPopupReferenceFieldMessage(this.page, message);
});

Then("the custom error {string} should be displayed below the {string} reference field", async function (expectedError, fieldName) {
  logger.info(`Verifying custom error "${expectedError}" is displayed below the "${fieldName}" reference field`);
  await DynamicAndReferenceFields.verifyReferenceFieldCustomError(this.page, expectedError, fieldName);
});

Then("no validation error is triggered for the reference field", async function () {
  logger.info("Verifying no validation error is triggered for the reference field");
  await DynamicAndReferenceFields.verifyNoReferenceFieldValidationError(this.page);
});

Then("clicking proceed should show a mandatory field validation error", async function () {
  logger.info("Clicking proceed to verify mandatory field validation error");
  const errorVisible = await DynamicAndReferenceFields.clickProceedAndVerifyMandatoryError(this.page);
  if (!errorVisible) {
    throw new Error("Expected a mandatory field validation error after clicking Proceed, but none was shown");
  }
});

// Opens the reference-field dropdown under test and types text to filter its options, leaving the
// dropdown open. Follow with the "... option {string} is displayed" and "I select the reference field
// dropdown option {string}" steps. Used by the "dropdown is filterable by typing" flow (test 57324).
When("I filter the reference field dropdown by typing {string}", async function (filterText) {
  logger.info(`Filtering the reference field dropdown by typing "${filterText}"`);
  await DynamicAndReferenceFields.filterReferenceFieldDropdownByTyping(this.page, filterText);
});

Then("the reference field dropdown option {string} is displayed", async function (optionText) {
  logger.info(`Verifying reference field dropdown option "${optionText}" is displayed`);
  await DynamicAndReferenceFields.verifyReferenceFieldDropdownOptionDisplayed(this.page, optionText);
});

When("I select the reference field dropdown option {string}", async function (optionText) {
  logger.info(`Selecting reference field dropdown option "${optionText}"`);
  await DynamicAndReferenceFields.selectReferenceFieldDropdownOption(this.page, optionText);
});

// Types text into a reference field (identified by its label) and commits the FIRST resulting option.
// Handles both reference-field widgets — an el-select dropdown (type-to-filter → first filtered item)
// and an autocomplete text field (type → first fetched suggestion) — so it drives the parent dropdown
// "BILLABLE OR NON BILLABLE" and the dependent autocomplete "MATTER CODE CLIENT TRAVEL" that appears
// after it, i.e. the autocomplete + dependency flow of test 37964.
When("I type {string} in reference field {string} to select the first dropdown option", async function (typedText, fieldName) {
  logger.info(`Typing "${typedText}" in reference field "${fieldName}" to select the first dropdown option`);
  await DynamicAndReferenceFields.typeAndSelectFirstReferenceFieldOption(this.page, fieldName, typedText);
});

// Asserts a single reference field's current value contains the given substring (case-insensitive).
// Used to verify an autocompleted/dependent field resolved to the expected value (test 37964). Reuses
// the same value reader as the "should have the following values" table assertion, passing one pair.
Then("reference field {string} should contain {string}", async function (fieldName, expectedSubstring) {
  logger.info(`Verifying reference field "${fieldName}" contains "${expectedSubstring}"`);
  const result = await DynamicAndReferenceFields.verifyReferenceFieldValues(this.page, [
    { label: fieldName, expectedValue: expectedSubstring },
  ]);
  const mismatch = result.results.find((r) => !r.match);
  if (mismatch) {
    throw new Error(
      `Reference field "${mismatch.label}" should contain "${mismatch.expected}", but its value was "${mismatch.actual}".`
    );
  }
});

Then("the dynamic profile field {string} is displayed for {string} travellers", async function (fieldName, travellerCount) {
  const expectedCount = Number.parseInt(travellerCount, 10);
  if (!Number.isInteger(expectedCount) || expectedCount < 1) {
    throw new Error(`Traveller count must be a positive integer, got: "${travellerCount}"`);
  }
  logger.info("Verifying dynamic profile field is displayed for travellers at checkout", { fieldName, expectedCount });
  await DynamicAndReferenceFields.verifyDynamicProfileFieldDisplayedForTravelers(this.page, fieldName, expectedCount);
});

// ===== TRAVELLERS REFERENCE QUESTIONS (per-traveller dynamic fields at checkout) =====

// Verifies the reference-questions section header is displayed at checkout (e.g. "Travellers
// Reference Questions"), which groups each traveller's dynamic/reference fields.
Then("the {string} reference section is displayed", async function (sectionTitle) {
  logger.info("Verifying reference section is displayed at checkout", { sectionTitle });
  await DynamicAndReferenceFields.verifyReferenceSectionDisplayed(this.page, sectionTitle);
});

// Verifies a specific traveller's block in the Travellers Reference Questions section shows the two
// named dynamic fields (e.g. "Payment Group" dropdown and "Bank account" textbox).
Then("the reference fields for traveller {string} show {string} and {string}", async function (travellerName, field1, field2) {
  logger.info("Verifying per-traveller reference fields at checkout", { travellerName, field1, field2 });
  await DynamicAndReferenceFields.verifyTravellerReferenceFieldsShown(this.page, travellerName, [field1, field2]);
});

// Verifies every value in the table appears among the reference field values shown at checkout
// (dropdown selected values + free-text field values), as an unordered set across all travellers.
Then("the reference field values are:", async function (dataTable) {
  const expectedValues = dataTable.raw().map((row) => row[0]);
  logger.info("Verifying reference field values at checkout", { expectedValues });
  await DynamicAndReferenceFields.verifyReferenceFieldValuesPresent(this.page, expectedValues);
});

// Edits the editable free-text reference fields (the "Bank account" textboxes, one per traveller) in
// DOM order to prove they accept new values at checkout.
When("I edit the reference field values to {string} and {string}", async function (value1, value2) {
  logger.info("Editing reference field textbox values at checkout", { value1, value2 });
  await DynamicAndReferenceFields.editReferenceFieldTextValues(this.page, [value1, value2]);
});

// Verifies the edited free-text reference field values persisted, matched positionally in DOM order.
Then("the reference field values are updated to {string} and {string}", async function (value1, value2) {
  logger.info("Verifying reference field textbox values were updated at checkout", { value1, value2 });
  await DynamicAndReferenceFields.verifyReferenceFieldTextValuesUpdated(this.page, [value1, value2]);
});

// ===== HYPERLINKS IN REFERENCE FIELDS (test 73097) =====

// Clicks the hyperlink embedded in a reference field inside the reference-fields popup. The link opens
// the linked page in a NEW browser tab, stored on the World for the following "opens the linked page"
// step to verify.
When("I click the reference field hyperlink", async function () {
  logger.info("Clicking the reference field hyperlink in the reference-fields popup");
  const opened = await DynamicAndReferenceFields.clickReferenceFieldHyperlink(this.page);
  this.newTabPage = opened.page;
  this.linkedHyperlinkHref = opened.href;
});

Then("the reference field hyperlink opens the linked page", async function () {
  logger.info("Verifying the reference field hyperlink opened the linked page");
  await DynamicAndReferenceFields.verifyLinkedPageOpened(this.newTabPage, this.linkedHyperlinkHref, this.page);
  this.newTabPage = null;
});
