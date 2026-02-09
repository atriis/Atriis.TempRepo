/**
 * Cart FOP (Form of Payment) Step Definitions
 *
 * Maps Gherkin steps to DSL methods for credit card / payment flows.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I add a credit card as payment method"
 *     → CartFOP.addCreditCard(page)
 *
 * Then Steps:
 *   "the payment method should be added"
 *     → CartFOP.isPaymentMethodAdded(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { CartFOP } = require("../../src/dsl");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a credit card as payment method", async function () {
  console.log("Adding credit card as payment method");
  await CartFOP.addCreditCard(this.page);
});

// ===== THEN STEPS =====

Then("the payment method should be added", async function () {
  console.log("Verifying payment method was added");
  const isAdded = await CartFOP.isPaymentMethodAdded(this.page);
  expect(isAdded).toBe(true);
});
