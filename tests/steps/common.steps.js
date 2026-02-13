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

setDefaultTimeout(120000);

// ===== WHEN STEPS - PRICE EXTRACTION =====

Then("the extracted price at index {int} should equal {float}", function (index, expectedValue) {
  console.log(`Asserting extracted price at index ${index} equals ${expectedValue}`);
  const actualValue = this.extractedPrices[index];
  expectNumbersToBeEqual(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be greater than {float}", function (index, expectedValue) {
  console.log(`Asserting extracted price at index ${index} > ${expectedValue}`);
  const actualValue = this.extractedPrices[index];
  expectNumberToBeGreaterThan(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be greater than or equal to {float}", function (index, expectedValue) {
  console.log(`Asserting extracted price at index ${index} >= ${expectedValue}`);
  const actualValue = this.extractedPrices[index];
  expectNumberToBeGreaterThanOrEqual(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be less than {float}", function (index, expectedValue) {
  console.log(`Asserting extracted price at index ${index} < ${expectedValue}`);
  const actualValue = this.extractedPrices[index];
  expectNumberToBeLessThan(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should be less than or equal to {float}", function (index, expectedValue) {
  console.log(`Asserting extracted price at index ${index} <= ${expectedValue}`);
  const actualValue = this.extractedPrices[index];
  expectNumberToBeLessThanOrEqual(actualValue, expectedValue, `Price at index ${index}`);
});

Then("the extracted price at index {int} should equal the extracted price at index {int}", function (indexA, indexB) {
  console.log(`Asserting extracted price at index ${indexA} equals price at index ${indexB}`);
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumbersToBeEqual(priceA, priceB, `Price comparison [${indexA}] vs [${indexB}]`);
});

Then("the sum of extracted prices at index {int} and {int} should equal {float}", function (indexA, indexB, expectedSum) {
  console.log(`Asserting sum of prices at index ${indexA} and ${indexB} equals ${expectedSum}`);
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum of prices [${indexA}] + [${indexB}]`);
});

Then("the sum of extracted prices at index {int} and {int} should equal the extracted price at index {int}", function (indexA, indexB, expectedIndex) {
  console.log(`Asserting sum of prices at index ${indexA} and ${indexB} equals price at index ${expectedIndex}`);
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  const expectedSum = this.extractedPrices[expectedIndex];
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum of prices [${indexA}] + [${indexB}] vs [${expectedIndex}]`);
});

Then("the sum of extracted prices at index {int} {string} and {int} {string} should equal the extracted price at index {int} {string}", function (indexA, labelA, indexB, labelB, expectedIndex, expectedLabel) {
  console.log(`Asserting sum of prices at index ${indexA} (${labelA}) and ${indexB} (${labelB}) equals price at index ${expectedIndex} (${expectedLabel})`);
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  const expectedSum = this.extractedPrices[expectedIndex];
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum [${indexA}] ${labelA} + [${indexB}] ${labelB} vs [${expectedIndex}] ${expectedLabel}`);
});

// ===== DIRECT COMPARISON (EXTRACT + ASSERT) =====

Then("the price at index {int} from {string} should equal the price at index {int} from {string}", async function (indexA, locationA, indexB, locationB) {
  console.log(`Comparing price at index ${indexA} from ${locationA} with index ${indexB} from ${locationB}`);
  
  // Extract price A
  const priceA = await extractPriceFromLocation(this.page, indexA, locationA);
  // Extract price B
  const priceB = await extractPriceFromLocation(this.page, indexB, locationB);
  
  expectNumbersToBeEqual(priceA, priceB, `Price [${indexA}] from ${locationA} vs [${indexB}] from ${locationB}`);
});

Then("the sum of prices at index {int} from {string} and index {int} from {string} should equal the price at index {int} from {string}", async function (indexA, locationA, indexB, locationB, expectedIndex, expectedLocation) {
  console.log(`Asserting sum of [${indexA}] from ${locationA} + [${indexB}] from ${locationB} equals [${expectedIndex}] from ${expectedLocation}`);
  
  // Extract all three prices
  const priceA = await extractPriceFromLocation(this.page, indexA, locationA);
  const priceB = await extractPriceFromLocation(this.page, indexB, locationB);
  const expectedSum = await extractPriceFromLocation(this.page, expectedIndex, expectedLocation);
  
  expectSumToBeEqual(priceA, priceB, expectedSum, `Sum [${indexA}] + [${indexB}] vs [${expectedIndex}]`);
});

// ===== THEN STEPS =====

Then('I should see the heading {string}', async function (text) {
  const { CommonPage } = require("../../src/pages/CommonPage");
  const commonPage = new CommonPage(this.page);
  await commonPage.validateHeading(text);
});

// ===== WHEN STEPS - PRICE EXTRACTION =====

When("I extract the price at index {int} from {string}", async function (index, location) {
  console.log(`Extracting price at index ${index} from ${location}`);
  
  const price = await extractPriceFromLocation(this.page, index, location);
  
  // Store extracted price with location context
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  
  console.log(`Extracted price from ${location}: ${price}`);
});
