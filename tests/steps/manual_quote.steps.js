require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const {
  ManualQuoteSearch,
} = require("../../src/dsl");
const logger = require("@utils/logger").child("ManualQuote");

setDefaultTimeout(120000);

// ===== WHEN STEPS =====

When("I add a flight manual quote from {string} to {string}", async function (from, to) {
  logger.info("Adding flight manual quote", { from, to });
  await ManualQuoteSearch.searchAndAddFlightManualQuote(this.page, { from, to });
});

When("I add a hotel manual quote in {string}", async function (city) {
  logger.info("Adding hotel manual quote", { city });
  await ManualQuoteSearch.addHotelManualQuote(this.page, city);
});

When("I navigate to the manual quote search page", async function () {
  logger.info("Navigating to the manual quote search page");
  await ManualQuoteSearch.openManualQuotePage(this.page);
});

Then("the manual quote page should warn {string}", async function (text) {
  logger.info("Verifying manual quote warning text", { text });
  await ManualQuoteSearch.expectWarningText(this.page, text);
});

Then("the manual quote page title should mention {string}", async function (fragment) {
  logger.info("Verifying manual quote heading", { fragment });
  await ManualQuoteSearch.expectHeadingContains(this.page, fragment);
});

Then("a Back button should be displayed on the manual quote page", async function () {
  logger.info("Verifying Back button is displayed on manual quote page");
  await ManualQuoteSearch.expectBackButtonVisible(this.page);
});

When("I click the Back button on the manual quote page", async function () {
  logger.info("Clicking Back button on manual quote page");
  await ManualQuoteSearch.clickBack(this.page);
});

// ===== CAR MANUAL QUOTE FORM OF PAYMENT =====

When("I navigate to car search form", async function () {
  logger.info("Switching to Car sub-tab in manual quote");
  await ManualQuoteSearch.navigateToCarSearchForm(this.page);
});

When("I scroll to the manual quote car form of payment section", async function () {
  logger.info("Scrolling to Car payment section");
  await ManualQuoteSearch.scrollToCarFopSection(this.page);
});

When("I open the manual quote car form of payment dropdown", async function () {
  logger.info("Opening Car FOP dropdown");
  await ManualQuoteSearch.openCarFopDropdown(this.page);
});

Then("the credit card {string} should be available", async function (cardName) {
  logger.info("Verifying credit card is available in FOP dropdown", { cardName });
  await ManualQuoteSearch.expectFopOptionVisible(this.page, cardName);
});

When("I select the credit card {string}", async function (cardName) {
  logger.info("Selecting credit card from FOP dropdown", { cardName });
  await ManualQuoteSearch.selectFopOption(this.page, cardName);
});

Then("the manual quote car card type should display {string}", async function (cardType) {
  logger.info("Verifying Car card type display value", { cardType });
  await ManualQuoteSearch.expectCardTypeDisplayed(this.page, cardType);
});

When("I open the manual quote car credit type dropdown", async function () {
  logger.info("Opening Car Card Type dropdown");
  await ManualQuoteSearch.openCardTypeDropdown(this.page);
});

Then(
  "the credit type dropdown should list the following card types",
  async function (dataTable) {
    const expectedList = dataTable.raw().map((row) => String(row[0]).trim());
    logger.info("Verifying card types in dropdown", { expectedList });
    await ManualQuoteSearch.expectCardTypesInDropdown(this.page, expectedList);
  },
);

// ===== OTHER PRODUCTS MANUAL QUOTE =====

When("I add a {string} other manual quote with comment {string} and base fare {int}", async function (quoteType, comment, baseFare) {
  logger.info("Adding other product manual quote", { quoteType, comment, baseFare });
  await ManualQuoteSearch.addOtherProductManualQuote(this.page, { quoteType, comment, baseFare });
});
