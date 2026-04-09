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

When("I save the card selection", async function () {
  logger.info("Saving card selection");
  await CartPayment.saveCardSelection(this.page);
});

When("I select card {int} and save", async function (index) {
  logger.info("Selecting card by index and saving", { index });
  await CartPayment.selectCardByIndexAndSave(this.page, index);
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

Then("the saved card mask should be visible as {string}", async function (maskedCard) {
  throw new Error(`TODO: implement 'the saved card mask should be visible as {string}' — assert saved card mask ${maskedCard} is visible in FOP area`);
});

When("I fill CVV with {string}", async function (cvv) {
  throw new Error(`TODO: implement 'I fill CVV with {string}' — type CVV value ${cvv} in CVV input`);
});

Then("CVV should display {string}", async function (cvv) {
  throw new Error(`TODO: implement 'CVV should display {string}' — assert CVV field contains ${cvv}`);
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

// ===== Missing card info flow (feature 64405) =====

Then("the default card should have a complete missing info button", async function () {
  logger.info("Verifying default card has complete missing info button");
  await CartPayment.verifyCompleteMissingInfoButtonVisible(this.page);
});

Then("the cart should show the in order to proceed warning", async function () {
  logger.info("Verifying 'In order to proceed' warning is visible");
  await CartPayment.verifyInOrderToProceedWarningVisible(this.page);
});

Then("the cart should not show the in order to proceed warning", async function () {
  logger.info("Verifying 'In order to proceed' warning is gone");
  await CartPayment.verifyInOrderToProceedWarningGone(this.page);
});

When("I click complete missing info for the holder name card", async function () {
  logger.info("Clicking complete missing info button for holder name card");
  await CartPayment.clickCompleteMissingInfo(this.page);
});

Then("the card form should show missing details for card holder name", async function () {
  logger.info("Verifying card form shows missing details for card holder name");
  await CartPayment.verifyMissingCardDetailsForm(this.page, {
    sectionTitle: "Missing details",
    labels: ["Card holder name *"],
  });
});

Then("the card form should show missing details for country", async function () {
  logger.info("Verifying card form shows missing details for country");
  await CartPayment.verifyMissingCardDetailsForm(this.page, {
    sectionTitle: "Missing details",
    labels: ["Country *"],
  });
});

Then("the current car FOP should be shown on cart", async function () {
  if (!this.currentCarFOP) {
    throw new Error("currentCarFOP is not set. Use step: I capture the current car FOP on results");
  }

  logger.info("Verifying current car FOP is shown on cart", { currentCarFOP: this.currentCarFOP });
  await CartPayment.verifyPaymentType(this.page, this.currentCarFOP);
});

Then("the current car FOP should remain the same after booking", async function () {
  if (!this.currentCarFOP) {
    throw new Error("currentCarFOP is not set. Use step: I capture the current car FOP on results");
  }

  logger.info("Verifying current car FOP remains the same after booking", { currentCarFOP: this.currentCarFOP });
  await CartPayment.expectBookingStatusToBe("Confirmed", { page: this.page });
  await CartPayment.verifyPaymentType(this.page, this.currentCarFOP, { timeout: 60_000 });
});

When("I save the card form with empty required fields", async function () {
  logger.info("Saving card form with empty required fields to trigger validation");
  await CartPayment.saveCardFormAndVerifyValidationError(this.page);
});

When("I fill in the card holder name as {string}", async function (name) {
  logger.info("Filling card holder name", { name });
  await CartPayment.fillMissingCardHolderName(this.page, name);
});

When("I save the missing card details", async function () {
  logger.info("Saving missing card details");
  await CartPayment.saveMissingCardDetails(this.page);
});

When("I click to edit the card", async function () {
  logger.info("Clicking edit card link");
  await CartPayment.clickEditCard(this.page);
});

When("I select the no country card", async function () {
  logger.info("Selecting the no country card");
  await CartPayment.selectNoCountryCard(this.page);
});

When("I select the first available country", async function () {
  logger.info("Selecting first available country from dropdown");
  await CartPayment.selectFirstCountry(this.page);
});

Then("the no country card should be displayed in cart", async function () {
  logger.info("Verifying no country card is displayed in cart");
  await CartPayment.verifyCardNameVisible(this.page, "no country");
});

Then("the CVV field should not be displayed", async function () {
  logger.info("Verifying CVV field is not displayed");
  await CartPayment.verifyCVVFieldNotVisible(this.page);
});

When("I fill the credit card CVV", async function () {
  logger.info("Filling credit card CVV (mandatory)");
  await CartPayment.fillCreditCardCVV(this.page);
});
