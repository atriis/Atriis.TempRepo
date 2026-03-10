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

When("I fill credit card details", async function () {
  logger.info("Filling credit card details in already-open form");
  await CartPayment.fillCreditCardDetails(this.page);
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

When("I fill credit card cvv if needed", async function () {
  logger.info("Filling credit card CVV if needed");
  await CartPayment.fillCreditCardCVVifNeeded(this.page);
});

When("I click the card {string} checkbox", async function (cardName) {
  logger.info("Selecting card by checkbox", { cardName });
  await CartPayment.selectCardByName(this.page, cardName);
});

When("I click payment restriction field", async function () {
  logger.info("Opening payment restriction field");
  await CartPayment.openPaymentRestrictionOptions(this.page);
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

Then("credit card {string} should look disabled", async function (cardName) {
  logger.info("Verifying credit card looks disabled", { cardName });
  await CartPayment.verifyCardLooksDisabled(this.page, cardName);
});

Then("{int} payment cards should be visible in the FOP panel", async function (count) {
  logger.info(`Verifying ${count} payment cards are visible in FOP panel`);
  await CartPayment.verifyCardCount(this.page, count);
});

Then("payment restriction text should be visible", async function () {
  logger.info("Verifying payment restriction text is visible");
  await CartPayment.verifyPaymentRestrictionFieldVisible(this.page);
});

Then("payment restriction options should include {string} and {string}", async function (optionOne, optionTwo) {
  logger.info("Verifying payment restriction options", { optionOne, optionTwo });
  await CartPayment.verifyPaymentRestrictionOptions(this.page, [optionOne, optionTwo]);
});

When("I click the set billback button in cart", async function () {
  logger.info("Clicking set billback button in cart");
  await CartPayment.clickSetBillback(this.page);
});

Then("the card {string} checkbox should be checked", async function (cardName) {
  logger.info("Verifying card checkbox is checked", { cardName });
  await CartPayment.verifyCardCheckboxChecked(this.page, cardName);
});

Then("add credit card details option should not be visible", async function () {
  logger.info("Verifying add credit card details option is not visible");
  await CartPayment.verifyNoOtherCCPrivilege(this.page);
});

Then("the payment options should include {string} and {string}", async function (optionOne, optionTwo) {
  logger.info("Verifying payment options include both options", { optionOne, optionTwo });
  await CartPayment.verifyPaymentOptions(this.page, [optionOne, optionTwo]);
});

When("I select the {string} payment option", async function (optionText) {
  logger.info("Selecting payment option", { optionText });
  await CartPayment.selectPaymentOption(this.page, optionText);
});

Then("payment restrictions are displayed for {string} option", async function (optionText) {
  logger.info("Verifying payment restrictions are displayed", { optionText });
  await CartPayment.verifyPaymentRestrictions(this.page, optionText);
});
