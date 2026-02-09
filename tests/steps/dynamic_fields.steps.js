/**
 * Dynamic and Reference Fields Step Definitions
 *
 * Maps Gherkin steps to DSL methods for dynamic/reference field flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I select the trip purpose reference field"
 *     → DynamicAndReferenceFields.selectTripPurposeReferenceField(page)
 *
 *   "I add a number checkout field"
 *     → DynamicAndReferenceFields.addNumberCheckoutField(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { DynamicAndReferenceFields } = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I select the trip purpose reference field", async function () {
  console.log("Selecting trip purpose reference field");
  await DynamicAndReferenceFields.selectTripPurposeReferenceField(this.page);
});

When("I add a number checkout field", async function () {
  console.log("Adding number checkout field");
  await DynamicAndReferenceFields.addNumberCheckoutField(this.page);
});
