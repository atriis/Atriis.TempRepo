/**
 * CartPayment (Form of Payment) Step Definitions
 *
 * Maps Gherkin steps to CartPayment DSL methods for payment flow orchestration.
 * CartPayment DSL handles adding credit cards and validating payment methods.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I add a credit card as payment method"
 *     → CartPayment.addCreditCard(page)
 *
 * Then Steps:
 *   "the payment method should be added"
 *     → CartPayment.isPaymentMethodAdded(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { CartPayment } = require("@dsl");
const logger = require("@utils/logger").child("CartPayment");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a credit card as payment method", async function () {
  logger.info("Adding credit card as payment method");
  await CartPayment.addCreditCard(this.page);
});

// ===== THEN STEPS =====

Then("the payment method should be added", async function () {
  logger.info("Verifying payment method was added");
  const isAdded = await CartPayment.isPaymentMethodAdded(this.page);
  expect(isAdded).toBe(true);
});
