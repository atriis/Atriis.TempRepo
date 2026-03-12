require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  expectNumbersToBeEqual,
  expectNumbersToBeEqualWithTolerance,
  expectNumberToBeGreaterThan,
  expectNumberToBeGreaterThanOrEqual,
  expectNumberToBeLessThan,
  expectNumberToBeLessThanOrEqual,
  expectSumToBeEqual,
} = require("../../src/assertions/numberAssertions");
const { extractPriceFromLocation } = require("../../src/utils/priceExtraction");
const { CommonPage } = require("@pages/CommonPage");
const logger = require("@utils/logger").child("Common");

setDefaultTimeout(120000);

Given("I work on tab {int}", async function (tabNumber) {
  logger.info("Switching active tab for scenario", { tabNumber });

  if (!this.context) {
    throw new Error("Browser context is not available. Login step must run first.");
  }

  if (!Number.isInteger(tabNumber) || tabNumber < 1) {
    throw new Error(`tabNumber must be a positive integer, got: ${tabNumber}`);
  }

  const pages = this.context.pages();
  const targetIndex = tabNumber - 1;

  if (targetIndex >= pages.length) {
    throw new Error(
      `Requested tab ${tabNumber} but only ${pages.length} tab(s) are open`,
    );
  }

  this.page = pages[targetIndex];
  await this.page.bringToFront();
});

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

Then("the extracted price at index {int} should equal the extracted price at index {int} within tolerance", function (indexA, indexB) {
  logger.info("Asserting extracted prices are equal within tolerance", { indexA, indexB, tolerance: 0.02 });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumbersToBeEqualWithTolerance(priceA, priceB, 0.02, `Price comparison [${indexA}] vs [${indexB}]`);
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
  const commonPage = new CommonPage(this.page);
  
  await expect(commonPage.getHeadingByText(text)).toBeVisible({ timeout: 30000 });
});

// ===== WHEN STEPS - PRICE EXTRACTION =====

When("I extract the price at index {int} from {string}", async function (index, location) {
  logger.info("Extracting price from location", { index, location });
  
  const price = await extractPriceFromLocation(this.page, index, location);
  
  // Store extracted price with location context
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  
  logger.info("Extracted price", { location, price });
  console.log(`[Price] index=${index} location="${location}" → ${price}`);
});

Then("I should see a success notification", async function () {
  logger.info("Verifying success notification is visible");
  const commonPage = new CommonPage(this.page);
  await commonPage.getSuccessNotification().waitFor({ state: "visible" });
});

// ===== WHEN STEPS =====

When("I click proceed button if visible", async function () {
  logger.info("Attempting to click Proceed button if visible");
  const commonPage = new CommonPage(this.page);
  await commonPage.clickProceedButtonIfVisible();
});