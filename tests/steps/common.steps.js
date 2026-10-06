require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  expectNumbersToBeEqual,
  expectNumbersToBeEqualWithTolerance,
  expectNumberToBeGreaterThan,
  expectNumberToBeGreaterThanOrEqual,
  expectNumberToBeLessThan,
  expectNumberToBeLessThanOrEqual,
  expectSumToBeEqualWithTolerance,
} = require("../../src/assertions/numberAssertions");
const { extractPriceFromLocation } = require("../../src/utils/priceExtraction");
const { CommonPage } = require("@pages/CommonPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { expect } = require("@playwright/test");
const App = require("@dsl/App");
const FlightPricing = require("@dsl/FlightPricing");
const Cart = require("@dsl/Cart");
const FlightResults = require("@dsl/FlightResults");
const Results = require("@dsl/Results");
const DynamicAndReferenceFields = require("@dsl/DynamicAndReferenceFields");
const Homepage = require("@dsl/Homepage");
const { getPricePerNightAndTotal } = require("../support/scenarioState");
const logger = require("@utils/logger").child("Common");

setDefaultTimeout(120000);

// ========================================
// GENERIC API INTERCEPTION
// ========================================

const SUPPORTED_APIS = {
  flightPricing: (page) => FlightPricing.startCapturingPricingResponse(page),
  quotes: (page) => Cart.startCapturingQuotesResponse(page),
  cancelledQuotes: (page) => Cart.startCapturingCancelledQuotesResponse(page),
  flightSearch: (page) => FlightResults.startCapturingSearchResponse(page),
};

/**
 * Generic API response interceptor. Must be called BEFORE the action that triggers the request.
 * Stores the promise in this.lastInterceptedResponsePromise.
 * Also sets the legacy-named variable (e.g. this.flightPricingResponsePromise) for backward compat.
 *
 * Supported API names: flightPricing, quotes, cancelledQuotes, flightSearch
 */
When('I start intercepting the {string} API response', function (apiName) {
  if (!SUPPORTED_APIS[apiName]) {
    throw new Error(`Unknown API name: "${apiName}". Supported values: ${Object.keys(SUPPORTED_APIS).join(', ')}`);
  }
  logger.info('Starting API response capture', { apiName });
  const promise = SUPPORTED_APIS[apiName](this.page);
  this.lastInterceptedResponsePromise = promise;
  // Backward compat aliases so existing Then steps continue to work
  if (apiName === 'flightPricing') this.flightPricingResponsePromise = promise;
  if (apiName === 'quotes') this.cartQuotesResponsePromise = promise;
});

/**
 * Resolves a dot-notation field path (e.g. "flightPricing.DisplayMarkup") on a JSON object.
 * Throws if the resolved value is not a finite number.
 *
 * @param {object} body - Parsed JSON response body.
 * @param {string} path - Dot-notation path to the field.
 * @returns {number}
 */
function resolveField(body, path) {
  const value = path.split('.').reduce((obj, key) => obj && obj[key], body);
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`Field "${path}" resolved to non-finite value: ${JSON.stringify(value)}`);
  }
  return num;
}

/**
 * Generic assertion: resolves two field paths from the last intercepted API response
 * and asserts that totalField === addendA + addendB (within 0.01 tolerance).
 *
 * Supports dot-notation paths for nested fields, e.g. "flightPricing.DisplayMarkup".
 *
 * Example Gherkin:
 *   Then the "totalPriceDisplayCurrency" in the intercepted response should equal "wholePrice" plus "markup"
 *   Then the "totalPriceDisplayCurrency" in the intercepted response should equal "wholePrice" plus "flightPricing.DisplayMarkup"
 */
Then('the {string} in the intercepted response should equal {string} plus {string}', async function (totalField, addendA, addendB) {
  if (!this.lastInterceptedResponsePromise) {
    throw new Error('No intercepted response found. Call "I start intercepting the {string} API response" before this step.');
  }
  logger.info('Validating field sum in intercepted response', { totalField, addendA, addendB });
  const response = await this.lastInterceptedResponsePromise;
  const raw = await response.json();
  const body = Array.isArray(raw) ? raw[0] : raw;
  if (!body) throw new Error('Intercepted response body is empty');

  const total = resolveField(body, totalField);
  const a = resolveField(body, addendA);
  const b = resolveField(body, addendB);
  const expected = a + b;
  const TOLERANCE = 0.01;

  logger.info('Field sum assertion', { totalField, total, addendA, a, addendB, b, expected });

  if (Math.abs(total - expected) > TOLERANCE) {
    throw new Error(
      `Expected "${totalField}" (${total}) to equal "${addendA}" (${a}) + "${addendB}" (${b}) = ${expected}, ` +
      `but difference was ${Math.abs(total - expected).toFixed(4)}`
    );
  }

  logger.info('Field sum validated', { total, a, b });
  return { total, a, b };
});

Then('the intercepted response should have at least one result where {string} is {string}', async function (field, expectedValue) {
  logger.info('Verifying the intercepted response has a matching result', { field, expectedValue });
  const { total, matches } = await Results.countResultsWhereFieldEquals(this.page, this.lastInterceptedResponsePromise, field, expectedValue);
  expect(matches, `Expected at least one of the ${total} results to have "${field}" = "${expectedValue}"`).toBeGreaterThan(0);
});

Then('the intercepted response should have no result where {string} is {string}', async function (field, expectedValue) {
  logger.info('Verifying the intercepted response has no matching result', { field, expectedValue });
  const { total, matches } = await Results.countResultsWhereFieldEquals(this.page, this.lastInterceptedResponsePromise, field, expectedValue);
  expect(matches, `Expected none of the ${total} results to have "${field}" = "${expectedValue}"`).toBe(0);
});

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

When("I refresh the page", async function () {
  logger.info("Refreshing the current page");
  await App.refreshPage(this.page);
});

When("I close tab {int}", async function (tabNumber) {
  logger.info("Closing tab for scenario", { tabNumber });

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

  const pageToClose = pages[targetIndex];
  const isClosingActivePage = this.page === pageToClose;

  await pageToClose.close();

  const remainingPages = this.context.pages();
  if (remainingPages.length === 0) {
    throw new Error("Cannot continue because closing the tab left no open pages.");
  }

  if (isClosingActivePage) {
    this.page = remainingPages[Math.max(0, targetIndex - 1)] || remainingPages[remainingPages.length - 1];
  } else if (!this.page || this.page.isClosed()) {
    this.page = remainingPages[remainingPages.length - 1];
  }

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

Then("the extracted price at index {int} should not equal the extracted price at index {int}", function (indexA, indexB) {
  logger.info("Asserting extracted prices are not equal", { indexA, indexB });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expect(priceA).not.toBe(priceB);
});

Then("the extracted price at index {int} should be greater than the extracted price at index {int}", function (indexA, indexB) {
  logger.info("Asserting extracted price is greater than another", { indexA, indexB });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumberToBeGreaterThan(priceA, priceB, `Price [${indexA}] vs [${indexB}]`);
});

Then("the extracted price at index {int} should be less than or equal to the extracted price at index {int}", function (indexA, indexB) {
  logger.info("Asserting extracted price is less than or equal to another", { indexA, indexB });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumberToBeLessThanOrEqual(priceA, priceB, `Price [${indexA}] vs [${indexB}]`);
});

Then("the extracted price at index {int} should equal the extracted price at index {int} within tolerance", function (indexA, indexB) {
  logger.info("Asserting extracted prices are equal within tolerance", { indexA, indexB, tolerance: 0.02 });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumbersToBeEqualWithTolerance(priceA, priceB, 0.02, `Price comparison [${indexA}] vs [${indexB}]`);
});

Then("the extracted price at index {int} should equal the extracted price at index {int} within tolerance of {float}", function (indexA, indexB, tolerance) {
  logger.info("Asserting extracted prices are equal within tolerance", { indexA, indexB, tolerance });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectNumbersToBeEqualWithTolerance(priceA, priceB, tolerance, `Price comparison [${indexA}] vs [${indexB}]`);
});

// Checks the stay total against the per-night price times a room-nights multiplier (e.g. 6 nights ×
// 2 rooms = 12), using the pair most recently extracted — the room-level price breakdown, or the
// cart's More Details drawer. It proves the marked-up nightly rate is what the total is built from.
//
// The tolerance is what the two figures can legitimately differ by, so it is derived rather than
// picked: the room-level breakdown reads whole-currency amounts, so multiplying a rounded nightly
// rate can drift by up to half a unit per night plus half a unit on the total, and 1% covers the
// rounding the app applies to taxes and markup on top of that. A missing or wrong markup is a far
// larger gap than either.
Then("the total price is price per night x {int} with tolerance", function (multiplier) {
  const { pricePerNight, totalPrice } = getPricePerNightAndTotal(this);
  const expectedTotal = pricePerNight * multiplier;
  const tolerance = Math.max(multiplier * 0.5 + 0.5, expectedTotal * 0.01);
  logger.info("Asserting the total price equals the per-night price times the room-nights multiplier", {
    pricePerNight,
    multiplier,
    expectedTotal,
    totalPrice,
    tolerance,
  });
  expectNumbersToBeEqualWithTolerance(
    totalPrice,
    expectedTotal,
    tolerance,
    `Total price vs price per night (${pricePerNight}) x ${multiplier}`,
  );
});

Then("the sum of extracted prices at index {int} and {int} should equal {float}", function (indexA, indexB, expectedSum) {
  logger.info("Asserting sum of extracted prices equals value", { indexA, indexB, expectedSum });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  expectSumToBeEqualWithTolerance(priceA, priceB, expectedSum, 0.02, `Sum of prices [${indexA}] + [${indexB}]`);
});

Then("the sum of extracted prices at index {int} and {int} should equal the extracted price at index {int}", function (indexA, indexB, expectedIndex) {
  logger.info("Asserting sum of extracted prices equals price at index", { indexA, indexB, expectedIndex });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  const expectedSum = this.extractedPrices[expectedIndex];
  expectSumToBeEqualWithTolerance(priceA, priceB, expectedSum, 0.2, `Sum of prices [${indexA}] + [${indexB}] vs [${expectedIndex}]`);
});

Then("the sum of extracted prices at index {int} {string} and {int} {string} should equal the extracted price at index {int} {string}", function (indexA, labelA, indexB, labelB, expectedIndex, expectedLabel) {
  logger.info("Asserting sum of labeled prices equals labeled price", { indexA, labelA, indexB, labelB, expectedIndex, expectedLabel });
  const priceA = this.extractedPrices[indexA];
  const priceB = this.extractedPrices[indexB];
  const expectedSum = this.extractedPrices[expectedIndex];
  expectSumToBeEqualWithTolerance(priceA, priceB, expectedSum, 0.5, `Sum [${indexA}] ${labelA} + [${indexB}] ${labelB} vs [${expectedIndex}] ${expectedLabel}`);
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
  
  expectSumToBeEqualWithTolerance(priceA, priceB, expectedSum, 0.02, `Sum [${indexA}] + [${indexB}] vs [${expectedIndex}]`);
});

// ===== THEN STEPS =====

Then('I should see the heading {string}', async function (text) {
  const commonPage = getPageObject(this.page, CommonPage);

  // Asserts on the first VISIBLE match: a page can render the same heading text more than once
  // (e.g. the hotel details drawer's "Overview" section h3 plus a nested h4), and the unfiltered
  // locator then throws a strict-mode violation instead of answering the question being asked.
  await expect(commonPage.getVisibleHeadingByText(text)).toBeVisible({ timeout: 30000 });
});

// Generic, domain-agnostic text-visibility check (whole-page scope, including an open modal) —
// distinct from "the {string} text should be visible in results" (results.steps.js), which is
// scoped to the results page only.
Then('text {string} should be visible', async function (text) {
  logger.info('Verifying text is visible on the page', { text });
  await Results.expectTextVisible(this.page, text);
});

Then('there should be {int} elements matching css locator {string}', async function (expectedCount, cssSelector) {
  logger.info('Validating list length by css locator', { expectedCount, cssSelector });

  if (!this.page) {
    throw new Error('page is required');
  }

  if (!Number.isInteger(expectedCount) || expectedCount < 0) {
    throw new Error(`expectedCount must be an integer >= 0, got: ${expectedCount}`);
  }

  if (!cssSelector || typeof cssSelector !== 'string') {
    throw new Error('cssSelector must be a non-empty string');
  }

  await expect.poll(
    async () => await this.page.locator(cssSelector).count(),
    { timeout: 30000 },
  ).toBe(expectedCount);
});

// ===== WHEN STEPS - PRICE EXTRACTION =====

When("I extract the price at index {int} from {string}", async function (index, location) {
  logger.info("Extracting price from location", { index, location });
  
  const price = await extractPriceFromLocation(this.page, index, location);
  
  // Store extracted price with location context
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(price);
  
  logger.info("Extracted price", { location, price });
  console.log(`[Price] index=${index} location="${location}" â†’ ${price}`);
});

// Explicit fixed wait. Use sparingly and only when a real UI/back-end settle
// time is required that cannot be observed with a specific locator wait — e.g.
// letting a pending hotel modification settle before re-checkout.
When("I wait for {int} seconds", async function (seconds) {
  logger.info("Waiting", { seconds });
  await this.page.waitForTimeout(seconds * 1000);
});

Then("I should see a success notification", async function () {
  logger.info("Verifying success notification is visible");
  const commonPage = getPageObject(this.page, CommonPage);
  await commonPage.getSuccessNotification().waitFor({ state: "visible" });
});

// ===== WHEN STEPS =====

// Soft/optional click â€” checks if the Proceed button is visible, waits up to 10s, clicks if it appears.
// Silently skips if the button never shows up (does NOT fail).
// Use this when the popup may or may not appear depending on the flow.
// For a strict click that FAILS if missing, use: "I click proceed on the reference fields popup" (dynamic_fields.steps.js)
When("I click proceed button if visible", async function () {
  logger.info("Attempting to click Proceed button if visible");
  const commonPage = getPageObject(this.page, CommonPage);
  await commonPage.clickProceedButtonIfVisible();
});

// Dismisses the open reference-fields popup via its Back/Close button, returning to the new-trip page
// without proceeding. Use when the traveller set must change (e.g. adding a guest) before re-searching.
When("I click the back button", async function () {
  logger.info("Clicking the back button to dismiss the reference fields popup");
  await DynamicAndReferenceFields.closeReferenceFieldsPopup(this.page);
});

// Scrolls the travel-request form to the bottom to reveal content below the fold (e.g. the hotel
// section). The subsequent verifies also scroll their targets into view, so exact offset is not
// critical here.
When("I scroll down the travel request form", async function () {
  logger.info("Scrolling down the travel request form");
  const commonPage = getPageObject(this.page, CommonPage);
  await commonPage.scrollTo();
});

// ===== DOCUMENT EXPIRY WARNINGS (AB#65307) =====

/**
 * Steps for the passport / visa / credit-card expiry warnings.
 *
 * The warning stack is located by HomePage and every verdict is made by the Homepage DSL: one
 * component (document-expiry-alerts) serves both the homepage and the trip search screen, so
 * splitting it across two page objects would only duplicate its selectors.
 *
 * Warnings are addressed by their visible TITLE rather than by document type, because the title is
 * the only thing that separates the two surfaces the same component serves — the traveller's own
 * homepage warning reads "Passport expired", while a booker's trip search warning for the same
 * document reads "<Traveller Name>'s passport expired". A booker's trip with two affected
 * travellers puts two otherwise-identical cards in one stack, and only the name tells them apart.
 */

// --- Homepage (the signed-in traveller's own documents) ---

Then("the {string} document expiry warning should be displayed on the homepage", async function (title) {
  logger.info("Verifying a document expiry warning is displayed on the homepage", { title });
  await Homepage.verifyDocumentExpiryAlertDisplayed(this.page, title, "homepage");
});

// An EXACT count, not a lower bound: the story requires one warning per affected document, so this
// is what proves nothing was merged and nothing dropped. It says nothing about WHICH documents —
// the per-title steps carry that.
Then(
  "{int} document expiry warnings should be displayed on the homepage",
  async function (expectedCount) {
    logger.info("Verifying how many document expiry warnings the homepage shows", { expectedCount });
    await Homepage.verifyDocumentExpiryAlertCount(this.page, expectedCount, "homepage");
  },
);

// --- Trip search page (a booker's selected travellers) ---

Then(
  "the {string} document expiry warning should be displayed on the trip search page",
  async function (title) {
    logger.info("Verifying a document expiry warning is displayed on the trip search page", { title });
    await Homepage.verifyDocumentExpiryAlertDisplayed(this.page, title, "tripSearchPage");
  },
);

// --- Warning content ---

// Scoped to one named card on purpose: every warning renders the same documentExpiry.message
// string, so an unscoped "the message is shown" check would pass against any card in the stack
// instead of the one the scenario just asserted.
Then(
  "the {string} document expiry warning should show the message {string}",
  async function (title, expectedMessage) {
    logger.info("Verifying the body message of a document expiry warning", { title, expectedMessage });
    await Homepage.verifyDocumentExpiryAlertMessage(this.page, title, expectedMessage);
  },
);

// Locating the card by title and reading the button off THAT card is the point: the label is derived
// from the document type, so this pairs each title with the action it is supposed to offer. It also
// stands in for a "displayed" check, since a missing card cannot yield a button.
Then(
  "the {string} document expiry warning should carry the {string} button",
  async function (title, expectedCtaLabel) {
    logger.info("Verifying the call-to-action of a document expiry warning", { title, expectedCtaLabel });
    await Homepage.verifyDocumentExpiryAlertCta(this.page, title, expectedCtaLabel);
  },
);

// --- Acting on a warning ---

// The CTA opens the affected traveller's profile through utilService.openNewWindow — a new tab on
// desktop. this.page is repointed at it (the convention "I open the traveler profile from the
// traveler name" follows) so the remaining assertions, and the After hook's failure screenshot,
// target the profile that was just opened.
When(
  "I click the {string} button in the {string} document expiry warning",
  async function (ctaLabel, title) {
    logger.info("Clicking the call-to-action of a document expiry warning", { ctaLabel, title });
    this.page = await Homepage.openProfileFromDocumentExpiryAlert(this.page, ctaLabel, title);
  },
);

// Where the CTA LANDS is asserted by "the user profile of {string} should open in a new tab on the
// passports and visas section", which lives in profile.steps.js — it drives the profile screen and
// belongs with the rest of that screen's steps.

// --- Absence: the profile edit privilege gate (AB#84862) ---

// The negative side of the feature: canShowExpiryAlerts() suppresses every warning for a profile the
// signed-in user may not edit, because the warning's only action opens that profile for editing. The
// DSL proves the app actually evaluated the documents (via the Vuex store) before it believes an
// empty stack — otherwise the flag being off would pass this step for the wrong reason.
Then("no document expiry warning should be displayed on the homepage", async function () {
  logger.info("Verifying no document expiry warning is displayed on the homepage");
  await Homepage.verifyNoDocumentExpiryAlerts(this.page, "homepage");
});

// Asserted independently of the card above, not scoped to it: a card rendered WITHOUT its button is
// a different defect from no card at all, and only a page-wide button count tells those two apart.
Then(
  "no {string} document expiry button should be displayed on the homepage",
  async function (ctaLabel) {
    logger.info("Verifying no document expiry call-to-action is displayed on the homepage", { ctaLabel });
    await Homepage.verifyNoDocumentExpiryAlertCta(this.page, ctaLabel, "homepage");
  },
);
