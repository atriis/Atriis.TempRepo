/**
 * Checkout Step Definitions
 *
 * Maps Gherkin steps to Checkout DSL methods for booking finalization.
 * Checkout DSL handles completing the booking and navigating to trip overview.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps:
 *   "I complete the booking"
 *     → Checkout.bookAndFinalize(page)
 *
 *   "I navigate to cart from checkout"
 *     → Checkout.navigateToCartFromCheckout(page)
 *
 * ========================
 */

require("module-alias/register");

const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { Checkout } = require("@dsl");
const logger = require("@utils/logger").child("Checkout");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I complete the booking", async function () {
  logger.info("Completing booking");
  await Checkout.bookAndFinalize(this.page);
});

When("I navigate to cart from checkout", async function () {
  logger.info("Navigating to cart from checkout page");
  await Checkout.navigateToCartFromCheckout(this.page);
});
