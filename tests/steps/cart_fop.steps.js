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
 *   "I click add payment method button"
 *     → CartPaymentPage.clickAddPaymentMethodButton()
 *
 *   "I click add card details button"
 *     → CartPaymentPage.clickAddCardDetailsButton()
 *
 *   "I click the back arrow"
 *     → CartPaymentPage.clickBackArrow()
 *
 * Then Steps:
 *   "the payment method should be added"
 *     → CartPayment.isPaymentMethodAdded(page)
 *
 *   "the card {string} should be visible"
 *     → CartPayment.expectCardVisible(page, cardName)
 *
 *   "the card details should be visible"
 *     → CartPayment.waitForCardDetailsToBeVisible(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { CartPayment } = require("@dsl");
const { getPageObject } = require("@utils/pageObjectCache");
const CartPaymentPage = require("@pages/CartPaymentPage");
const logger = require("@utils/logger").child("CartPayment");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a credit card as payment method", async function () {
  logger.info("Adding credit card as payment method");
  await CartPayment.addCreditCard(this.page);
});

When("I click add payment method button", async function () {
  logger.info("Clicking add payment method button");
  const fop = getPageObject(this.page, CartPaymentPage);
  await fop.clickAddPaymentMethodButton();
});

When("I click add card details button", async function () {
  logger.info("Clicking add card details button");
  const fop = getPageObject(this.page, CartPaymentPage);
  await fop.clickAddCardDetailsButton();
});

When("I click the back arrow", async function () {
  logger.info("Clicking back arrow");
  const fop = getPageObject(this.page, CartPaymentPage);
  await fop.clickBackArrow();
});

// ===== THEN STEPS =====

Then("the payment method should be added", async function () {
  logger.info("Verifying payment method was added");
  const isAdded = await CartPayment.isPaymentMethodAdded(this.page);
  expect(isAdded).toBe(true);
});

Then("the card {string} should be visible", async function (cardName) {
  logger.info("Verifying card is visible", { cardName });
  await CartPayment.expectCardVisible(this.page, cardName);
  // Store card name for later use in scenario
  this.addedCardName = cardName;
});

Then("the card details text should be visible", async function () {
  logger.info("Verifying card details text is visible");
  await CartPayment.waitForCardDetailsToBeVisible(this.page);
});
