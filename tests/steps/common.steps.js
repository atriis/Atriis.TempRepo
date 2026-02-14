/**
 * Common Step Definitions
 *
 * Generic steps that can be used across multiple test scenarios.
 *
 * ===== STEP CATALOG =====
 *
 * When Steps - Price Extraction:
 *   "I extract the price at index {int} from {string}"
 *     → CommonPage.getAmountPriceValue(index)
 *     → Supports: "results", "cart", "pricing options"
 *
 * Then Steps - Number Assertions:
 *   "the extracted price at index {int} should equal {float}"
 *   "the extracted price at index {int} should be greater than {float}"
 *   "the extracted price at index {int} should be greater than or equal to {float}"
 *   "the extracted price at index {int} should be less than {float}"
 *   "the extracted price at index {int} should be less than or equal to {float}"
 *   "the extracted price at index {int} should equal the extracted price at index {int}"
 *   "the sum of extracted prices at index {int} and {int} should equal {float}"
 *   "the sum of extracted prices at index {int} and {int} should equal the extracted price at index {int}"
 *   "the sum of extracted prices at index {int} {string} and {int} {string} should equal the extracted price at index {int} {string}"
 *   "the price at index {int} from {string} should equal the price at index {int} from {string}"
 *   "the sum of prices at index {int} from {string} and index {int} from {string} should equal the price at index {int} from {string}"
 *
 * ========================
 */

require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  expectNumbersToBeEqual,
  expectNumberToBeGreaterThan,
  expectNumberToBeGreaterThanOrEqual,
  expectNumberToBeLessThan,
  expectNumberToBeLessThanOrEqual,
  expectSumToBeEqual,
} = require("../../src/assertions/numberAssertions");
const { extractPriceFromLocation } = require("../../src/utils/priceExtraction");
const logger = require("@utils/logger").child("Common");

setDefaultTimeout(120000);

// ===== WHEN STEPS - PRICE EXTRACTION =====

Then("the extracted price at index {int} should equal {float}", function (index, expectedValue) {
  logger.info("Asserting extracted price equals value", { index, expectedValue });
  const actualValue = this.extractedPrices[index];
  expectNumbersToBeEqual(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be greater than {float}", function (index, expectedValue) {
  logger.info("Asserting extracted price is greater than value", { index, expectedValue });
  const actualValue = this.extractedPrices[index];
  expectNumberToBeGreaterThan(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be greater than or equal to {float}", function (index, expectedValue) {
  logger.info("Asserting extracted price is greater than or equal to value", { index, expectedValue });
  const actualValue = this.extractedPrices[index];
  expectNumberToBeGreaterThanOrEqual(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be less than {float}", function (index, expectedValue) {
  logger.info("Asserting extracted price is less than value", { index, expectedValue });
  const actualValue = this.extractedPrices[index];
  expectNumberToBeLessThan(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be less than or equal to {float}", function (index, expectedValue) {
  logger.info("Asserting extracted price is less than or equal to value", { index, expectedValue });
  const actualValue = this.extractedPrices[index];
  expectNumberToBeLessThanOrEqual(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should equal the extracted price at index {int}", function (indexA, indexB) {
  logger.info("Asserting extracted prices are equal", { indexA, indexB });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumbersToBeEqual(priceA, priceB, `Price comparison [${indexA}] vs [${indexB}]`);
});

Then("the sum of extracted prices at index {int} and {int} should equal {float}", function (indexA, indexB, expectedSum) {
  logger.info("Asserting sum of extracted prices equals value", { indexA, indexB, expectedSum });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum of prices [${indexA}] + [${indexB}]`);
});

Then("the sum of extracted prices at index {int} and {int} should equal the extracted price at index {int}", function (indexA, indexB, expectedIndex) {
  logger.info("Asserting sum of extracted prices equals price at index", { indexA, indexB, expectedIndex });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  const expectedSum = this.extractedPrices[expectedIndex];
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum of prices [${indexA}] + [${indexB}] vs [${expectedIndex}]`);
});

Then("the sum of extracted prices at index {int} {string} and {int} {string} should equal the extracted price at index {int} {string}", function (indexA, labelA, indexB, labelB, expectedIndex, expectedLabel) {
  logger.info("Asserting sum of labeled prices equals labeled price", { indexA, labelA, indexB, labelB, expectedIndex, expectedLabel });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  const expectedSum = this.extractedPrices[expectedIndex];
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum [${indexA}] ${labelA} + [${indexB}] ${labelB} vs [${expectedIndex}] ${expectedLabel}`);
});

// ===== DIRECT COMPARISON (EXTRACT + ASSERT) =====

Then("the price at index {int} from {string} should equal the price at index {int} from {string}", async function (indexA, locationA, indexB, locationB) {
  logger.info("Comparing prices from different locations", { indexA, locationA, indexB, locationB });
  
  // Extract price A
  const priceA = await extractPriceFromLocation(this.page, indexA, locationA);
  // Extract price B
  const priceB = await extractPriceFromLocation(this.page, indexB, locationB);
  
  expectNumbersToBeEqual(priceA, priceB, `Price [${indexA}] from ${locationA} vs [${indexB}] from ${locationB}`);
});

Then("the sum of prices at index {int} from {string} and index {int} from {string} should equal the price at index {int} from {string}", async function (indexA, locationA, indexB, locationB, expectedIndex, expectedLocation) {
  logger.info("Asserting sum of prices from locations equals price", { indexA, locationA, indexB, locationB, expectedIndex, expectedLocation });
  
  // Extract all three prices
  const priceA = await extractPriceFromLocation(this.page, indexA, locationA);
  const priceB = await extractPriceFromLocation(this.page, indexB, locationB);
  const expectedSum = await extractPriceFromLocation(this.page, expectedIndex, expectedLocation);
  
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum [${indexA}] + [${indexB}] vs [${expectedIndex}]`);
});

// ===== THEN STEPS =====

Then('I should see the heading {string}', async function (text) {
  const { expect } = require('@playwright/test');
  const { CommonPage } = require("../../src/pages/CommonPage");
  const commonPage = new CommonPage(this.page);
  
  const headingVisible = await commonPage.isHeadingVisible(text);
  expect(headingVisible, `Heading "${text}" should be visible`).toBe(true);
});

// ===== WHEN STEPS - PRICE EXTRACTION =====

When("I extract the price at index {int} from {string}", async function (index, location) {
  logger.info("Extracting price from location", { index, location });
  
  const price = await extractPriceFromLocation(this.page, index, location);
  
  // Store extracted price with location context
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  
  logger.info("Extracted price", { location, price });
});
