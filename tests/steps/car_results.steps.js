require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { CarResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("CarResults");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SELECTION & CART
// ========================================

When("I add a car from city center results to cart", async function () {
  logger.info("Adding car from city center results to cart");
  await CarResults.addCarCityCenterFromResultsPageToCart(this.page);
});

When("I add the first car to cart", async function () {
  logger.info("Adding first car to cart");
  await CarResults.addCarAirportFromResultsPageToCart(this.page);
});

Then("the first car result shows \"{int} days total\" and a daily rate", async function (expectedDays) {
  logger.info("Verifying days total and daily rate on the first car result", { expectedDays });
  const result = await CarResults.expectDaysTotalAndDailyRateDisplayed(this.page, expectedDays);
  this.carResultsDailyRate = result.dailyRateAmount;
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the car location at city center index {int} should contain {string}", async function (index, expectedCity) {
  logger.info("Verifying car location contains expected city", { index, expectedCity });
  await CarResults.expectLocationToContain(this.page, index, expectedCity);
});

Then("the car location at airport index {int} should contain {string} on results", async function (index, expectedAirport) {
  logger.info("Verifying car airport location contains expected airport location on results", { index, expectedAirport });
  await CarResults.expectAirportAddressToContain(this.page, index, expectedAirport);
});

Then("the car location label at index {int} should contain {string} on results", async function (index, expectedLabel) {
  logger.info("Verifying car location label at index contains expected label on results", { index, expectedLabel });
  await CarResults.expectLocationLabelToContain(this.page, index, expectedLabel);
});

Then("the car city center address at index {int} should contain {string} on results", async function (index, expectedAddress) {
  logger.info("Verifying car city center address at index contains expected address on results", { index, expectedAddress });
  await CarResults.expectCityCenterAddressToContain(this.page, index, expectedAddress);
});

When("I select the first city center pickup location", async function () {
  logger.info("Selecting the first city center pickup location");
  await CarResults.selectFirstCityCenterPickupLocation(this.page);
});

When("I select the first city center dropoff location", async function () {
  logger.info("Selecting the first city center dropoff location");
  await CarResults.selectFirstCityCenterDropoffLocation(this.page);
});

Then("the agency station label should contain {string} on the vendor list", async function (expectedLabel) {
  if (!expectedLabel || typeof expectedLabel !== 'string') {
    throw new Error('expectedLabel must be a non-empty string');
  }

  logger.info("Verifying agency station label is visible on the vendor list", { expectedLabel });
  await CarResults.expectAgencyStationLabelOnVendorList(this.page, expectedLabel);
});

Then("the agency station label should contain {string} and address should contain {string} on the vendor list", async function (expectedLabel, expectedAddress) {
  if (!expectedLabel || typeof expectedLabel !== 'string') {
    throw new Error('expectedLabel must be a non-empty string');
  }

  if (!expectedAddress || typeof expectedAddress !== 'string') {
    throw new Error('expectedAddress must be a non-empty string');
  }

  logger.info("Verifying agency station label and address are visible on the vendor list", { expectedLabel, expectedAddress });
  await CarResults.expectAgencyStationLabelOnVendorList(this.page, expectedLabel, expectedAddress);
});

When("I select the city center pickup location by agency station label {string}", async function (stationLabel) {
  if (!stationLabel) {
    logger.info("Skipping selection - no station label provided, selecting first city center pickup location instead");
    await CarResults.selectFirstCityCenterPickupLocation(this.page);
    return;
  }
  logger.info("Selecting city center pickup location by agency station label", { stationLabel });
  await CarResults.selectCityCenterPickupLocationByLabel(this.page, stationLabel);
});

When("I select the city center pickup location by agency station label {string} and address {string}", async function (stationLabel, stationAddress) {
  if (!stationLabel || !stationAddress) {
    logger.info("Skipping selection by label and address - missing value(s), selecting first city center pickup location instead");
    await CarResults.selectFirstCityCenterPickupLocation(this.page);
    return;
  }
  logger.info("Selecting city center pickup location by agency station label and address", { stationLabel, stationAddress });
  await CarResults.selectCityCenterPickupLocationByLabel(this.page, stationLabel, stationAddress);
});

Then("none of the car result titles should contain the word {string}", async function (word) {
  logger.info("Verifying car result titles do not contain unexpected word", { word });
  await CarResults.assertCarTitlesDoNotContainWord(this.page, word);
});

When("I sort car results by {string}", async function (sortOption) {
  logger.info("Sorting car results", { sortOption });
  await CarResults.sortCarResultsBy(this.page, sortOption);
});

When("I go to the last page of car results", async function () {
  logger.info("Going to the last page of car results");
  await CarResults.goToLastCarResultsPage(this.page);
});

Then("the out of policy indicator should be visible in the last car result", async function () {
  logger.info("Verifying the out of policy indicator is visible in the last car result");
  await CarResults.expectOutOfPolicyIndicatorOnLastCarResult(this.page);
});

When("I filter car results by the {string} sustainability checkbox", async function (label) {
  logger.info("Filtering car results by sustainability checkbox", { label });
  await CarResults.filterCarResultsBySustainability(this.page, label);
});

Then("all the car options on this page contain {string} model text", async function (expectedText) {
  logger.info("Verifying all car options contain expected model text", { expectedText });
  await CarResults.assertAllCarTitlesContainText(this.page, expectedText);
});

Then("all car results should show the eco option tag {string}", async function (expectedLabel) {
  logger.info("Verifying every car result shows the eco option tag", { expectedLabel });
  await CarResults.assertAllCarResultsShowEcoOptionTag(this.page, expectedLabel);
});

Then("the payment type on results should be {string}", async function (expectedPaymentType) {
  logger.info("Verifying car payment type on results", { expectedPaymentType });
  await CarResults.expectPaymentTypeOnResults(this.page, expectedPaymentType);
});

Then("the car FOP on results should be {string}", async function (expectedFOP) {
  logger.info("Verifying car FOP on results", { expectedFOP, agency: this.currentCarAgency || null });
  await CarResults.expectCurrentFOPOnResults(this.page, expectedFOP, { agencyName: this.currentCarAgency });
});

Then("the car FOP for agency {string} on results should be {string}", async function (agencyName, expectedFOP) {
  logger.info("Verifying car FOP for agency on results", { agencyName, expectedFOP });
  await CarResults.expectCurrentFOPOnResults(this.page, expectedFOP, { agencyName });
});

When("I capture the current car FOP on results", async function () {
  logger.info("Capturing current car FOP on results");
  this.currentCarFOP = await CarResults.getCurrentFOPOnResults(this.page);
  logger.info("Captured current car FOP on results", { currentCarFOP: this.currentCarFOP });
});

Then("the car model should be visible in the results", async function () {
  logger.info("Verifying car model is visible in results");
  await CarResults.expectCarModelIsVisible(this.page);
});

Then("the car results section should be displayed", async function () {
  logger.info("Verifying car results section is displayed via breadcrumb");
  await CarResults.expectCarResultsSectionDisplayed(this.page);
});

Then("the parallel car location should be {string}", async function (expectedLocation) {
  logger.info("Verifying the parallel car location on the results header", { expectedLocation });
  await CarResults.verifyCarResultsLocation(this.page, expectedLocation);
});

Then("the {string} filter should be visible in car results", async function (filterTitle) {
  logger.info("Verifying filter is visible in car results", { filterTitle });
  await CarResults.verifyFilterVisibleOnResults(this.page, filterTitle);
});

Then("the agreement text should be displayed in the car results tooltip", async function () {
  logger.info("Verifying agreement text is displayed in the car results tooltip");
  const result = await CarResults.verifyAgreementTextDisplayedInCarResultsTooltip(this.page);
  logger.info("Agreement text tooltip validated", { tooltipText: result.tooltipText });
});

When("I hover over the agreement in the first car result", async function () {
  logger.info("Hovering over the agreement in the first car result");
  await CarResults.hoverAgreementInFirstCarResult(this.page);
});

Then("the car results agreement tooltip should display the logo for {string}", async function (expectedAgreementText) {
  logger.info("Verifying the agreement logo is displayed in the car results tooltip", { expectedAgreementText });
  const result = await CarResults.verifyAgreementLogoDisplayedInTooltip(this.page, expectedAgreementText);
  logger.info("Agreement logo validated", { tooltipText: result.tooltipText, logoSrc: result.logoSrc });
});

Then("handshake badge should be visible in car results", async function () {
  logger.info("Verifying the agreement (handshake) badge is visible in car results");
  await CarResults.verifyHandshakeBadgeVisible(this.page);
});

Then("handshake badge should not be visible in car results", async function () {
  logger.info("Verifying the agreement (handshake) badge is not visible in car results");
  await CarResults.verifyHandshakeBadgeNotVisible(this.page);
});

// Count-agnostic on purpose: the supplier returns a different number of city-centre stations on
// every run, so this asserts across however many station cards are currently rendered.
Then("I should see the location name and address displayed for all station results", async function () {
  logger.info("Verifying every city center station result displays a location name and address");
  const result = await CarResults.expectAllStationsShowLocationNameAndAddress(this.page);
  logger.info("Station location name and address verified", { stationsChecked: result.stationsChecked });
});

Then("the first station should have a {string} button", async function (buttonName) {
  if (!buttonName || typeof buttonName !== 'string') {
    throw new Error(`buttonName must be a non-empty string, got: ${buttonName}`);
  }

  logger.info("Verifying first station button is visible", { buttonName });
  await CarResults.expectStationButtonVisible(this.page, 0, buttonName);
});

// ========================================
// PAYMENT & TERMS - CARS SPECIFIC
// ========================================

async function clickTermsAndConditionsLinkStep(contextLabel) {
  const { Cart } = require("@dsl");
  logger.info(`Clicking terms and conditions link ${contextLabel}`);
  await Cart.clickPaymentTermsLink(this.page);
  this.termsAndConditionsModalOpenedAtStep = true;
}

When("I click on the terms and conditions link in the car results tooltip", async function () {
  await clickTermsAndConditionsLinkStep.call(this, 'in car results tooltip');
});

// Card-level "Terms and conditions" button on the first car result (car-preview.vue
// `.more-details-btn`) — scoped to the car card, unlike the generic payment-terms link above.
When("I click on the terms and conditions link in the car results", async function () {
  logger.info("Clicking the terms and conditions button on the first car result");
  await CarResults.clickTermsAndConditionsInCarResults(this.page);
});

When("I close the terms and conditions modal", async function () {
  const { Cart } = require("@dsl");
  logger.info("Closing terms and conditions modal");
  await Cart.closeTermsModal(this.page);
  this.termsAndConditionsModalClosed = true;
});

// Asserts inside the car Terms & Conditions dialog (car-terms-conditions.vue), which is the same
// component in results, cart and after booking. Not for the hotel/rail terms modals.
Then("the terms and conditions modal should display the text {string}", async function (expectedText) {
  const { Cart } = require("@dsl");
  logger.info(`Verifying terms and conditions modal displays text: ${expectedText}`);
  await Cart.verifyCarTermsDialogContainsText(this.page, expectedText);
});

Then("the terms and conditions modal should display the {string} section", async function (sectionHeading) {
  const { Cart } = require("@dsl");
  logger.info(`Extracting terms and conditions modal section: ${sectionHeading}`);
  const result = await Cart.extractAndVerifyTermsModalSection(this.page, sectionHeading);
  this.termsAndConditionsSection = result;
});

When("I open the first car location link in results", async function () {
  logger.info("Opening first car location link in results");
  this.carLocationContext = await CarResults.openFirstCarLocationLinkInResults(this.page);
});

Then("I should see the selected car location in Google Maps", async function () {
  logger.info("Verifying selected car location in Google Maps");
  const locationContext = this.carLocationContext || {};
  if (!locationContext.mapsPage) {
    throw new Error('Missing Google Maps context. Ensure step "When I open the first car location link in results" ran successfully before this assertion.');
  }

  await CarResults.verifySelectedCarLocationInGoogleMaps(
    this.page,
    locationContext.mapsPage,
  );
});

// ========================================
// LOCATION DETAILS TOOLTIP - CAR RESULTS
// ========================================

// Opens the tooltip and deliberately leaves it OPEN: the two extract steps below read pickup and
// drop-off from the same rendered tooltip, so closing here would empty the DOM they depend on.
When("I click location details in the car results", async function () {
  logger.info("Opening the location details tooltip on the first car result");
  await CarResults.openLocationDetailsOnFirstCarResult(this.page);
  this.locationDetailsTooltipOpened = true;
});

// Where each extracted address is parked on the Cucumber World for the comparison step below.
const LOCATION_ADDRESS_WORLD_KEY = {
  pickup: 'pickupLocationAddress',
  dropoff: 'dropoffLocationAddress',
};

async function extractLocationAddressInLocationDetails(locationType) {
  if (!this.locationDetailsTooltipOpened) {
    throw new Error(
      `Extracting the ${locationType} location address requires a preceding ` +
      '"When I click location details in the car results" step — the tooltip is not rendered until it is opened.'
    );
  }

  const address = await CarResults.getLocationAddressFromLocationDetails(this.page, locationType);
  this[LOCATION_ADDRESS_WORLD_KEY[locationType]] = address;
  logger.info(`Extracted ${locationType} location address from location details`, { [locationType]: address });
}

When("I extract the pickup location address in location details", async function () {
  await extractLocationAddressInLocationDetails.call(this, 'pickup');
});

When("I extract the dropoff location address in location details", async function () {
  await extractLocationAddressInLocationDetails.call(this, 'dropoff');
});

// Pure comparison of two already-extracted values — no page interaction, so the assertion belongs
// here rather than in the DSL. Both sides are whitespace/case-normalized first so a cosmetic
// formatting difference cannot pass this off as two genuinely different locations.
Then("the pickup and dropoff locations should be different", async function () {
  const pickup = this.pickupLocationAddress;
  const dropoff = this.dropoffLocationAddress;

  if (!pickup || !dropoff) {
    throw new Error(
      '"the pickup and dropoff locations should be different" requires both the ' +
      '"I extract the pickup location address in location details" and ' +
      '"I extract the dropoff location address in location details" steps to have run. ' +
      `Got pickup: ${JSON.stringify(pickup)}, dropoff: ${JSON.stringify(dropoff)}`
    );
  }

  const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
  const normalizedPickup = normalize(pickup);
  const normalizedDropoff = normalize(dropoff);

  logger.info("Verifying pickup and dropoff locations are different", { pickup, dropoff });

  expect(
    normalizedPickup,
    `Expected the pickup and drop-off locations to differ because the search used different pickup and ` +
    `drop-off locations, but both resolved to the same address. Pickup: "${pickup}". Drop-off: "${dropoff}".`
  ).not.toBe(normalizedDropoff);
});

Then("the car results should be displayed in the map matching the results on the page", async function () {
  logger.info("Verifying the station map plots every located station from the results list");
  await CarResults.verifyStationsDisplayedInMapMatchResults(this.page);
});

// ========================================
// COUNTER LOCATION FILTER STEPS
// ========================================

Then("the {string} filter options should only contain valid counter location values", async function (filterTitle) {
  const validOptions = ["At airport", "Shuttle required", "Other/unknown"];
  logger.info("Verifying filter options are valid counter location values", { filterTitle, validOptions });
  await CarResults.verifyFilterOptionsAreValidCounterLocations(this.page, filterTitle, validOptions);
});

When("I select the {string} option in the {string} filter", async function (optionLabel, filterTitle) {
  logger.info("Selecting filter option", { optionLabel, filterTitle });
  await CarResults.selectFilterOption(this.page, optionLabel, filterTitle);
});

Then("only {string} counter location results should be displayed", async function (optionLabel) {
  const filterTitle = "Rental Counter Location";
  logger.info("Verifying counter location filter is active", { optionLabel, filterTitle });
  await CarResults.verifyCounterLocationFilterIsActive(this.page, optionLabel, filterTitle);
});

When("I deselect the {string} option in the {string} filter", async function (optionLabel, filterTitle) {
  logger.info("Deselecting filter option", { optionLabel, filterTitle });
  await CarResults.deselectFilterOption(this.page, optionLabel, filterTitle);
  this.lastDeselectedFilter = { optionLabel, filterTitle };
});

Then("all car results should be restored", async function () {
  if (!this.lastDeselectedFilter) {
    throw new Error('"all car results should be restored" requires a preceding "I deselect the ... option in the ... filter" step');
  }
  const { optionLabel, filterTitle } = this.lastDeselectedFilter;
  logger.info("Verifying all car results are restored after filter removed", { optionLabel, filterTitle });
  await CarResults.verifyAllCarResultsRestored(this.page, optionLabel, filterTitle);
});

Then("the first car result should be from rental agency {string}", async function (agencyName) {
  logger.info("Verifying first car result is from preferred rental agency", { agencyName });
  await CarResults.assertFirstCarResultIsFromAgency(this.page, agencyName);
});

When("I click see details for {string} result", async function (resultIndex) {
  const index = parseInt(resultIndex, 10);
  logger.info("Clicking 'See details' on station result", { resultIndex: index });
  await CarResults.clickSeeDetailsForStationResult(this.page, index);
});

Then("the displayed station opening hours are {string}", async function (expectedHoursCsv) {
  const expectedHours = expectedHoursCsv.split(",").map((entry) => entry.trim()).filter(Boolean);
  logger.info("Verifying displayed station opening hours", { expectedHours });
  await CarResults.expectStationOpeningHours(this.page, expectedHours);
});

Then("the add to trip button in the first car result should be visible and disabled", async function () {
  logger.info("Verifying the first car result's 'Add to trip' button is visible but disabled by travel policy");
  await CarResults.expectAddToTripButtonRestrictedInCarResult(this.page, 0);
});

// ========================================
// THEN/WHEN STEPS - CITY CENTER STATION STATUS (67021)
// ========================================

// Maps the quoted Gherkin status label to the exact SunnyCars open-status message (Atriis.App
// src/assets/locale/en.json car.carStation.*). Message text, not a CSS class or the raw
// StationOpenStatus enum value, is what reliably identifies a station's status here - see
// CarResults.expectStationStatusColorAtIndex for why the class name cannot be trusted for this.
const STATION_STATUS_MESSAGES = {
  'Closed': 'The station is closed on the selected dates and times',
  'Open On Request': 'The station can be opened on request on the selected dates and times',
};
const STATION_OPEN_MESSAGE = 'The station is open on the selected dates and times';

function resolveStationStatusMessage(status) {
  const message = STATION_STATUS_MESSAGES[status];
  if (!message) {
    throw new Error(
      `[car_results.steps] Unknown station status "${status}". Known statuses: ${Object.keys(STATION_STATUS_MESSAGES).join(', ')}`
    );
  }
  return message;
}

// Finds the first city-center station card in the given status and verifies its status word is
// displayed in the given color. Stores the found index on `this.stationIndex` for the paired
// button-state/click-see-details steps that follow it in the same status block.
Then(
  "I verify that first {string} station status is displayed in {word} on the results page - search until you find the first one to validate things",
  async function (status, color) {
    logger.info("Searching city-center results for first station with status", { status, color });
    const message = resolveStationStatusMessage(status);
    this.stationIndex = await CarResults.findFirstStationIndexByStatusMessage(this.page, message);
    await CarResults.expectStationStatusColorAtIndex(this.page, this.stationIndex, color);
  }
);

// Same "search until found" contract as above, for the Open status (no color check - the Open
// status word renders without a colored span at all).
Then(
  "I verify that first open station has select button enabled on the results page - search until you find the first one to validate things",
  async function () {
    logger.info("Searching city-center results for first open station");
    this.stationIndex = await CarResults.findFirstStationIndexByStatusMessage(this.page, STATION_OPEN_MESSAGE);
    await CarResults.expectStationSelectButtonStateAtIndex(this.page, this.stationIndex, true);
  }
);

Then("first {string} station status select button is {word}", async function (status, state) {
  if (state !== 'enabled' && state !== 'disabled') {
    throw new Error(`[car_results.steps] "select button is {word}" must be "enabled" or "disabled", got: ${state}`);
  }
  logger.info("Verifying station select button state", { status, state, stationIndex: this.stationIndex });
  await CarResults.expectStationSelectButtonStateAtIndex(this.page, this.stationIndex, state === 'enabled');
});

When("I click first {string} station status see details button", async function (status) {
  logger.info("Clicking see details for station", { status, stationIndex: this.stationIndex });
  await CarResults.clickSeeDetailsForStationResult(this.page, this.stationIndex + 1);
});

Then("I verify that first {string} station status is displayed in {word} on see details modal", async function (status, color) {
  logger.info("Verifying station status color in see details modal", { status, color });
  await CarResults.expectStationStatusColorInModal(this.page, color);
});

When("I close see details modal", async function () {
  logger.info("Closing station see details modal");
  await CarResults.closeStationDetailsModal(this.page);
});

Then("text {string} should be visible for the first open station that has select button enabled", async function (expectedText) {
  logger.info("Verifying open station's status message on the results page card", { expectedText, stationIndex: this.stationIndex });
  await CarResults.expectStationStatusMessageAtIndex(this.page, this.stationIndex, expectedText);
});

// Reuses the same "see details" click as the Closed/Open On Request steps above; the feature's
// own wording ("first first") is a typo in the source scenario, kept verbatim here to match it.
When("I click first first open station that has select button enabled see details button", async function () {
  logger.info("Clicking see details for the first open station", { stationIndex: this.stationIndex });
  await CarResults.clickSeeDetailsForStationResult(this.page, this.stationIndex + 1);
});
