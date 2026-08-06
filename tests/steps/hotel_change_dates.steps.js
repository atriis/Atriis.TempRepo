require("module-alias/register");

const { Given, When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const HotelChangeDates = require("@dsl/HotelChangeDates");
const { CartPage } = require("@pages/CartPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { extractDateTokens } = require("@utils/text");
const { expectNumbersToBeEqualWithTolerance } = require("../../src/assertions/numberAssertions");
const { extractPriceFromLocation } = require("@utils/priceExtraction");
const logger = require("@utils/logger").child("HotelChangeDates");

setDefaultTimeout(120000);

// The availability check and the "Continue" (PUT /HotelModify) call are real
// supplier round-trips that can each run for minutes, so these steps need step
// timeouts well above the internal DSL waits (120s availability / up to 300s modify).
const CHECK_AVAILABILITY_STEP_TIMEOUT_MS = 180000;
const MODIFY_STEP_TIMEOUT_MS = 360000;
const PRICE_TOLERANCE = 1;

/**
 * Combines one or more formatted date strings into the comparable "<day> <mon>"
 * tokens used across the cart (e.g. "15 sep"), so dates rendered in different
 * formats still compare cleanly.
 * @param {...string} dateStrings
 * @returns {string[]}
 */
function dateTokensOf(...dateStrings) {
  // Normalize the day part so leading zeros never cause false mismatches
  // (e.g. the picker yields "1 dec" while the UI renders "01 dec").
  return dateStrings
    .flatMap((s) => extractDateTokens(s || ""))
    .map((token) => {
      const [day, ...rest] = token.split(" ");
      return [String(Number(day)), ...rest].join(" ");
    });
}

When("I open the Change Dates option from the hotel quote menu", async function () {
  logger.info("Opening the Change Dates modification from the hotel quote menu");
  await HotelChangeDates.openChangeDatesModification(this.page);
});

Then("the change dates page should open in the same tab", async function () {
  const { onUrl, title } = await HotelChangeDates.getChangeDatesPageState(this.page);
  logger.info("Change Dates page state", { onUrl, title });
  expect(onUrl, `Expected to be on the change-dates route, current URL: ${this.page.url()}`).toBe(true);
  expect(title.toLowerCase(), 'Change Dates page title mismatch').toContain("change dates");
});

When("I select new hotel dates for 1 night 1 month from the original dates", async function () {
  // The new stay is a 1-night date comfortably after the original booking and
  // outside the close month (the DSL computes it from today).
  this.newDatesPicked = await HotelChangeDates.selectNewDates(this.page, { nights: 1 });
  logger.info("Selected new hotel dates", this.newDatesPicked);
});

When("I extract the new selected dates", async function () {
  this.extractedNewDates = await HotelChangeDates.extractSelectedNewDates(this.page);
  logger.info("Extracted new selected dates from the change-dates field", { dates: this.extractedNewDates });
});

When("I check availability for the new dates", { timeout: CHECK_AVAILABILITY_STEP_TIMEOUT_MS }, async function () {
  await HotelChangeDates.checkAvailability(this.page);
});

Then("the availability summary should show the new dates", async function () {
  this.availabilityDetails = await HotelChangeDates.getAvailabilityDetails(this.page);
  const { heading, newDatesText, panelText } = this.availabilityDetails;

  expect(heading.toLowerCase(), 'Availability heading mismatch').toContain("availability");

  if (!this.newDatesPicked) {
    throw new Error('No selected dates stored. Run the "select new hotel dates" step first.');
  }
  const expectedTokens = dateTokensOf(this.newDatesPicked.checkIn, this.newDatesPicked.checkOut);
  const shownTokens = dateTokensOf(newDatesText, panelText);
  expect(expectedTokens.length, 'Could not derive date tokens from the selected dates').toBeGreaterThan(0);
  for (const token of expectedTokens) {
    expect(shownTokens, `Availability summary "${newDatesText}" should include selected date "${token}"`)
      .toContain(token);
  }
});

Then("the original total should equal the extracted cart price", async function () {
  if (!Array.isArray(this.extractedPrices) || this.extractedPrices.length === 0) {
    throw new Error('No extracted cart price found. Run \'I extract the price at index 0 from "cart"\' first.');
  }
  if (!this.availabilityDetails) {
    throw new Error('No availability details stored. Run "the availability summary should show the new dates" first.');
  }
  const extractedCartPrice = this.extractedPrices[0];
  logger.info("Comparing original total with extracted cart price", {
    originalTotal: this.availabilityDetails.originalTotal,
    extractedCartPrice,
  });
  expectNumbersToBeEqualWithTolerance(
    this.availabilityDetails.originalTotal,
    extractedCartPrice,
    PRICE_TOLERANCE,
    'Original total on the change-dates page should equal the price extracted from the cart',
  );
});

Then("the difference should equal the updated total minus the original total", async function () {
  if (!this.availabilityDetails) {
    throw new Error('No availability details stored. Run "the availability summary should show the new dates" first.');
  }
  const { originalTotal, updatedTotal, difference, panelText } = this.availabilityDetails;

  // The panel must label all three totals.
  const panel = (panelText || "").toLowerCase();
  for (const label of ["original total", "updated total", "difference"]) {
    expect(panel, `Availability panel should show the "${label}" label`).toContain(label);
  }

  logger.info("Verifying difference equals updated minus original", { originalTotal, updatedTotal, difference });
  expectNumbersToBeEqualWithTolerance(
    difference,
    updatedTotal - originalTotal,
    PRICE_TOLERANCE,
    'Difference should equal Updated total minus Original total',
  );
});

When("I extract the updated total price", async function () {
  if (!this.availabilityDetails) {
    this.availabilityDetails = await HotelChangeDates.getAvailabilityDetails(this.page);
  }
  this.extractedUpdatedPrice = this.availabilityDetails.updatedTotal;
  logger.info("Stored updated total price", { updatedTotal: this.extractedUpdatedPrice });
});

When("I continue the date modification", { timeout: MODIFY_STEP_TIMEOUT_MS }, async function () {
  await HotelChangeDates.continueModification(this.page);
});

Then("the hotel quote should show the Pending modification status", async function () {
  const cartPage = getPageObject(this.page, CartPage);
  const status = await cartPage.getHotelQuoteStatusText();
  logger.info("Hotel quote status after modification", { status });
  expect(status.toLowerCase(), 'Hotel quote status should be "Pending modification"')
    .toContain("pending modification");
});

Then("the hotel quote should show a modification countdown of about 30 minutes", async function () {
  const cartPage = getPageObject(this.page, CartPage);
  const countdownText = await cartPage.getModificationCountdownText();
  logger.info("Modification countdown text", { countdownText });
  expect(countdownText, 'A modification countdown should be visible on the quote').not.toBe("");

  const match = countdownText.match(/(\d{1,2})\s*:\s*\d{2}/) || countdownText.match(/(\d{1,2})/);
  expect(match, `Countdown "${countdownText}" should contain a minutes value`).not.toBeNull();
  const minutes = Number(match[1]);
  // A 30-minute clock, read a little after it starts. Generous lower bound absorbs
  // the minutes the modify round-trip itself can take.
  expect(minutes, `Countdown minutes ${minutes} should be roughly 30 (15–31 accepted)`).toBeGreaterThanOrEqual(15);
  expect(minutes, `Countdown minutes ${minutes} should be roughly 30 (15–31 accepted)`).toBeLessThanOrEqual(31);
});

Then("a Cancel Modify button should be visible on the hotel quote", async function () {
  const cartPage = getPageObject(this.page, CartPage);
  const visible = await cartPage.isCancelModifyButtonVisible();
  expect(visible, 'The "Cancel Modify" button should be visible on the hotel quote').toBe(true);
});

Then("the hotel quote dates in cart should equal the extracted new dates", async function () {
  if (!this.newDatesPicked) {
    throw new Error('No selected dates stored. Run the "select new hotel dates" step first.');
  }
  const cartPage = getPageObject(this.page, CartPage);
  const cartDates = await cartPage.getHotelPreviewDatesText();
  const expectedTokens = dateTokensOf(this.newDatesPicked.checkIn, this.newDatesPicked.checkOut);
  const cartTokens = dateTokensOf(cartDates);
  logger.info("Comparing cart hotel dates with the new dates", { cartDates, expectedTokens });
  expect(expectedTokens.length, 'Could not derive date tokens from the selected dates').toBeGreaterThan(0);
  for (const token of expectedTokens) {
    expect(cartTokens, `Cart hotel dates "${cartDates}" should include new date "${token}"`)
      .toContain(token);
  }
});

Then("the price at index 0 from cart should match the extracted updated price", async function () {
  if (this.extractedUpdatedPrice === undefined) {
    throw new Error('No updated total stored. Run "I extract the updated total price" first.');
  }
  const cartPrice = await extractPriceFromLocation(this.page, 0, "cart");
  logger.info("Comparing cart price index 0 with the extracted updated price", {
    cartPrice,
    updatedPrice: this.extractedUpdatedPrice,
  });
  expectNumbersToBeEqualWithTolerance(
    cartPrice,
    this.extractedUpdatedPrice,
    PRICE_TOLERANCE,
    'Cart price should match the Updated total from the change-dates page',
  );
});
