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
const Cart = require("../../src/dsl/Cart");
const { CartPage } = require("@src/pages/CartPage");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a credit card as payment method", async function () {
  console.log("Adding credit card as payment method");
  await CartFOP.addCreditCard(this.page);
});

When("I click to open fare rules in cart", async function () {
  console.log("Clicking to open fare rules in cart");
  await Cart.clickToOpenFareRulesInCart(this.page);
});

When("I accept Terms & Conditions", async function () {
  console.log("Accepting T&Cs");
  const cartPage = new CartPage(this.page);
  await cartPage.acceptTermsAndConditions();
});

// ===== THEN STEPS =====

Then("the payment method should be added", async function () {
  console.log("Verifying payment method was added");
  const isAdded = await CartFOP.isPaymentMethodAdded(this.page);
  expect(isAdded).toBe(true);
});

When("I hold the trip", async function () {
  console.log("Holding the trip");
  await Cart.holdTrip(this.page);
});

Then("I successfully cancel the trip", async function () {
  console.log("Cancelling the trip successfully"); 
  await Cart.cancelTripStrict(this.page); 
});

When("I click to open price breakdown in cart", async function () {
  console.log("Clicking to open price breakdown in cart");
  await Cart.clickToOpenPriceBreakdown(this.page);
});

When("I close price breakdown modal", async function () {
  console.log("Closing price breakdown modal");
  const cartPage = new CartPage(this.page);
  await cartPage.clickXToClosePriceBreakdownModal();
});