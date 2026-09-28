require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { HotelLevelResults, RoomLevelResults } = require("../../src/dsl");
const logger = require("@utils/logger").child("HotelResults");
const HotelLevelResultsPage = require("../../src/pages/HotelLevelResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");
const { getGsaAllowance } = require("../support/scenarioState");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SELECTION
// ========================================
When("I filter hotel results by hotel name {string}", async function (hotelName) {
  logger.info(`Filtering hotel results by hotel name: ${hotelName}`);
  await HotelLevelResults.filterByHotelName(this.page, hotelName);
});

When("I filter hotel results by hotel name {string} or skip if unavailable", async function (hotelName) {
  logger.info(`Filtering hotel results by hotel name (with fallback): ${hotelName}`);
  const { filtered } = await HotelLevelResults.filterByHotelNameOrFallback(this.page, hotelName);
  if (!filtered) {
    logger.warn(`Filter for "${hotelName}" returned no results â€” filter cleared, using full list`);
  }
});

When("I filter hotel results by hotel name {string} or {string}", async function (primaryName, fallbackName) {
  logger.info("Filtering hotel results by hotel name with fallback", { primaryName, fallbackName });
  const { usedName } = await HotelLevelResults.filterByHotelNameWithFallback(this.page, primaryName, fallbackName);
  logger.info("Hotel name filter applied", { usedName });
});

When("I select the first hotel result", async function () {
  logger.info("Selecting first hotel option");
  await HotelLevelResults.clickFirstHotelOption(this.page);
});

When("I select a hotel with member rates", async function () {
  logger.info("Selecting first hotel with member rates");
  await HotelLevelResults.clickFirstHotelWithMemberRate(this.page);
});

When("I wait to see view rates text in results page", { timeout: 180000 }, async function () {
  logger.info("Waiting to see view rates text in results page");
  const hotelLevelResultsPage = getPageObject(this.page, HotelLevelResultsPage);
  await hotelLevelResultsPage.waitForViewRatesText();
});

When("I extract the price from hotel level results", async function () {
  logger.info("Extracting price from hotel level results");
  this.hotelLevelPrice = await HotelLevelResults.extractHotelLevelPrice(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(this.hotelLevelPrice);
  logger.info("Stored hotel level price", { hotelLevelPrice: this.hotelLevelPrice });
});

When("I wait for the hotel results page to load", async function () {
  logger.info("Waiting for hotel results page to load");
  const hotelLevelResultsPage = getPageObject(this.page, HotelLevelResultsPage);
  await hotelLevelResultsPage.waitForResultsPageReady();
});

When("I open the hotel results map view", async function () {
  logger.info("Opening hotel results map view");
  await HotelLevelResults.openResultsMapView(this.page);
});

When("I wait for the hotel map markers to load", async function () {
  logger.info("Waiting for hotel map markers to load");
  await HotelLevelResults.waitForMapMarkers(this.page);
});

When("I drag the hotel map to the {string}", async function (direction) {
  logger.info("Dragging hotel map", { direction });
  await HotelLevelResults.dragResultsMap(this.page, direction);
});

When("I open the first hotel from the map preview in a new browser tab", async function () {
  logger.info("Opening first hotel from map preview in a new browser tab");
  const { roomLevelTab, hotelName } = await HotelLevelResults.openFirstHotelFromMapPreviewInNewTab(this.page);
  this.roomLevelTab = roomLevelTab;
  this.mapPreviewHotelName = hotelName;
  logger.info("Captured the hotel name from the map preview", { hotelName });
});
// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the hotel results destination on top of the page should contain {string}", async function (city) {
  logger.info("Verifying hotel results destination on top of page contains city", { city });
  await HotelLevelResults.verifyHotelResultsDestination(this.page, city);
});

Then("the parallel {word} modal should contain {string}", { timeout: 140000 }, async function (product, text) {
  logger.info("Verifying the parallel search loader popup contains text", { product, text });
  await HotelLevelResults.verifyParallelSearchLoaderContains(this.page, text);
});

Then("the new browser tab should show the room level page", async function () {
  logger.info("Verifying the new browser tab shows the room level page");
  const result = await RoomLevelResults.verifyRoomLevelPageOpenedInNewTab(this.page, this.roomLevelTab);
  logger.info("Room level tab verification result", result);
});

Then("the hotel name in the new browser tab should match the hotel selected on the map", async function () {
  logger.info("Verifying the new browser tab shows the hotel selected on the map");
  const result = await RoomLevelResults.verifyHotelNameInRoomLevel(this.roomLevelTab, this.mapPreviewHotelName);
  logger.info("Hotel name verification result", result);
});

Then("every room in the new browser tab should show a price greater than zero", async function () {
  logger.info("Verifying every room in the new browser tab shows a price greater than zero");
  const result = await RoomLevelResults.verifyRoomPricesAreNotZero(this.roomLevelTab);
  logger.info("Room price verification result", result);
});

Then("I should see member rates displayed in hotel level results", async function () {
  logger.info("Verifying member rates are displayed in hotel level results");
  const isVisible = await HotelLevelResults.verifyMemberRatesDisplayed(this.page);
  logger.info("Member rates verification result", { isVisible });
  expect(isVisible).toBe(true);
});

Then("I should see a tag with the text {string} in hotel level results", async function (tagText) {
  logger.info("Verifying member badge tag text in hotel level results", { tagText });
  await HotelLevelResults.verifyMemberBadgeTagText(this.page, tagText);
});

Then("the corporate preferred badge should be visible on hotel level results", async function () {
  logger.info("Verifying corporate preferred badge is visible on hotel level results");
  await HotelLevelResults.verifyCorporatePreferredBadge(this.page);
});

Then("the {string} loyalty badge should be visible in hotel level results", async function (chainName) {
  logger.info("Verifying hotel loyalty badge is visible in hotel level results", { chainName });
  const label = await HotelLevelResults.verifyLoyaltyBadgeInHotelLevel(this.page, chainName);
  logger.info("Hotel loyalty badge found in hotel level results", { chainName, label });
});

Then("the CO2 emissions should be displayed in hotel level results", async function () {
  logger.info("Verifying CO2 emissions are displayed in hotel level results");
  const result = await HotelLevelResults.verifyCO2InHotelLevel(this.page);
  logger.info("CO2 verification result in hotel level", { visible: result.visible, value: result.value });
  expect(result.visible).toBe(true);
});
Then("the {string} supplier logo should be visible in hotel results", async function (supplierName) {
  logger.info("Verifying supplier logo is visible", { supplierName });
  const isVisible = await HotelLevelResults.verifySupplierLogo(this.page, supplierName);
  if (!isVisible) throw new Error(`Supplier logo for "${supplierName}" not visible in hotel results`);
});

Then("the first hotel result should display the {string} agreement", async function (labelText) {
  logger.info("Verifying agreement label is visible for first hotel result", { labelText });
  await HotelLevelResults.verifyAgreementLabelForFirstHotel(this.page, labelText);
});

Then("hovering over the {string} agreement should show {string} in the tooltip", async function (labelText, tooltipText) {
  logger.info("Verifying agreement tooltip text", { labelText, tooltipText });
  await HotelLevelResults.verifyAgreementResultsForCorporate(this.page, labelText, tooltipText);
});

Then("the sustainability filter checkbox should be enabled and clickable", async function () {
  logger.info("Verifying sustainability filter checkbox is enabled and clickable");
  await HotelLevelResults.verifySustainabilityFilterEnabled(this.page);
});

Then("hovering over the sustainable tag should show the hotel certifications tooltip", async function () {
  logger.info("Verifying the certifications tooltip opens on the sustainable tag");
  await HotelLevelResults.verifyHotelCertificationsTooltip(this.page);
});

Then("each certification is listed in the tooltip exactly once", async function () {
  logger.info("Verifying each certification is listed in the tooltip exactly once");
  await HotelLevelResults.verifyEachCertificationListedOnce(this.page);
});

When("I sort hotel results by {string}", async function (label) {
  logger.info("Sorting hotel results by", { label });
  await HotelLevelResults.sortBy(this.page, label);
});

When("I select hotel result at index {int}", async function (index) {
  logger.info("Selecting hotel result by index", { index });
  await HotelLevelResults.clickHotelByIndex(this.page, index);
});

// Opens the hotel card's "More details" drawer and leaves it open (the ordinal is the 1-based hotel
// card position). Use "I close the open drawer" afterwards before acting on the results list again.
When("I open the more details drawer for the {int} hotel result", async function (index) {
  logger.info("Opening the hotel details drawer by index", { index });
  await HotelLevelResults.openMoreDetailsDrawerByIndex(this.page, index);
});

Then("hotel {int} should display the {string} amenity", async function (index, amenityName) {
  logger.info("Verifying amenity is displayed on hotel", { index, amenityName });
  await HotelLevelResults.verifyAmenityDisplayed(this.page, index, amenityName);
});

Then("hotel {int} should not display the {string} amenity", async function (index, amenityName) {
  logger.info("Verifying amenity is NOT displayed on hotel", { index, amenityName });
  await HotelLevelResults.verifyAmenityNotDisplayed(this.page, index, amenityName);
});

When("I edit the hotel search location to {string}", async function (newLocation) {
  logger.info("Editing hotel search location", { newLocation });
  await HotelLevelResults.editHotelSearchLocation(this.page, newLocation);
});

Then("the hotel results should be for the new location {string}", async function (expectedLocation) {
  logger.info("Verifying hotel results are for new location", { expectedLocation });
  await HotelLevelResults.verifyResultsLocation(this.page, expectedLocation);
});

When("I scroll through hotel filters", async function () {
  logger.info("Scrolling through hotel filters");
  await HotelLevelResults.scrollHotelFilters(this.page);
});

Then("I see hotel level filter sections", async function () {
  logger.info("Verifying hotel level filter sections are visible");
  await HotelLevelResults.verifyHotelFilters(this.page);
});

When("I apply hotel level filter {string} with option {string}", async function (filterName, optionText) {
  logger.info("Applying hotel level filter", { filterName, optionText });
  await HotelLevelResults.applyHotelFilter(this.page, filterName, optionText);
});

Then("the {string} filter tag should be visible in hotel results", async function (tagText) {
  logger.info("Verifying hotel filter tag is visible", { tagText });
  await HotelLevelResults.verifyHotelFilterTag(this.page, tagText);
});

Then("the TMC agreement filter is checked in hotel results", async function () {
  logger.info("Verifying the TMC agreement filter is checked in hotel level results");
  await HotelLevelResults.verifyTmcAgreementFilterChecked(this.page);
});

Then("the corporate agreement filter is checked in hotel results", async function () {
  logger.info("Verifying the corporate agreement filter is checked in hotel level results");
  await HotelLevelResults.verifyCorporateAgreementFilterChecked(this.page);
});

Then("all hotels have a corporate agreement tag", async function () {
  logger.info("Verifying all hotels have a corporate agreement tag");
  await HotelLevelResults.verifyCorporateAgreementTagOnAllHotels(this.page);
});

Then(/^"[Hh]otel [Ww]asn't [Ff]ound" error message is not displayed$/, async function () {
  logger.info('Verifying hotel results are displayed without "Hotel wasn\'t found" message');
  await HotelLevelResults.verifyHotelWasntFoundMessageNotDisplayed(this.page);
});

Then("handshake badge should be visible in hotel level results", async function () {
  logger.info("Verifying handshake agreement badge is visible in hotel level results");
  await HotelLevelResults.verifyHandshakeBadgeVisible(this.page);
});

Then("agreement badge should be visible on all hotels in hotel level results", async function () {
  logger.info("Verifying every hotel in hotel level results has the agreement badge");
  await HotelLevelResults.verifyAgreementBadgeOnAllHotels(this.page);
});

When("I select the last hotel result", async function () {
  logger.info("Scrolling to and selecting the last hotel in results");
  // Kept for the next page's scroll assertion: it can only mean something if the hotel
  // list really was scrolled away from its top when the hotel was selected.
  this.hotelListScrollOffsetAtSelection = await HotelLevelResults.clickLastHotelOption(this.page);
});

Then("the sort filter has {string} selected", async function (expectedLabel) {
  logger.info("Verifying sort filter selection", { expectedLabel });
  await HotelLevelResults.verifySortSelected(this.page, expectedLabel);
});

Then("all hotels are sorted by price from lowest to highest", async function () {
  logger.info("Verifying hotel results are sorted by price from lowest to highest");
  await HotelLevelResults.verifyHotelsSortedByPriceAscending(this.page);
});

When("I share the hotel price offer by email from results", async function () {
  logger.info("Sharing hotel price offer by email from hotel-level results page");
  await HotelLevelResults.shareHotelPriceOfferByEmail(this.page);
});

When("I enter share mode on hotel results", async function () {
  logger.info("Entering share mode on hotel-level results page");
  await HotelLevelResults.enterShareMode(this.page);
});

Then("there should be {int} supplier(s) in the supplier filters", async function (expectedCount) {
  logger.info("Verifying supplier filter count", { expectedCount });
  await HotelLevelResults.verifySupplierFilterCount(this.page, expectedCount);
});

Then("the {string} supplier filter should be visible", async function (supplierName) {
  logger.info("Verifying supplier filter is visible", { supplierName });
  await HotelLevelResults.verifySupplierFilterVisible(this.page, supplierName);
});

Then("the {string} supplier logo should not be visible in hotel results", async function (supplierName) {
  logger.info("Verifying supplier logo is NOT visible", { supplierName });
  await HotelLevelResults.verifySupplierLogoNotVisible(this.page, supplierName);
});

Then("the {string} supplier filter should not be visible", async function (supplierName) {
  logger.info("Verifying supplier filter is NOT visible", { supplierName });
  await HotelLevelResults.verifySupplierFilterNotVisible(this.page, supplierName);
});

Then("the hotel search check-in date should match the arrival date of the outbound first flight", async function () {
  logger.info("Verifying hotel check-in date matches outbound first flight arrival date", { expectedDate: this.outboundFirstFlightArrivalDate });
  await HotelLevelResults.verifyHotelCheckInDateMatchesFlight(this.page, this.outboundFirstFlightArrivalDate);
});

Then("the hotel search check-out date should match the departure date of the inbound first flight", async function () {
  logger.info("Verifying hotel check-out date matches inbound first flight departure date", { expectedDate: this.inboundFirstFlightDepartureDate });
  await HotelLevelResults.verifyHotelCheckOutDateMatchesFlight(this.page, this.inboundFirstFlightDepartureDate);
});

Then("preferred hotels should be displayed in results", async function () {
  logger.info("Verifying preferred hotels are displayed (corporate preferred badge)");
  await HotelLevelResults.verifyCorporatePreferredBadge(this.page);
});

Then(/^the hotel results should include hotels matching \/(.*)\/$/,  async function (patternStr) {
  logger.info("Verifying hotel names match pattern", { pattern: patternStr });
  const result = await HotelLevelResults.verifyHotelNamesMatchPattern(this.page, new RegExp(patternStr));
  logger.info("Matching hotels found", { names: result.names });
});

Then("the hotel at position {int} should be {string}", async function (index, expectedName) {
  logger.info("Verifying hotel name at position", { index, expectedName });
  await HotelLevelResults.verifyHotelNameAtIndex(this.page, index, expectedName);
});

Then("the hotel at position {int} should be highlighted", async function (index) {
  logger.info("Verifying hotel at position is highlighted", { index });
  await HotelLevelResults.verifyHotelHighlightedAtIndex(this.page, index);
});

Then("the hotel at position {int} should preferably be {string}", async function (index, expectedName) {
  logger.info("Soft-checking hotel name at position (non-blocking)", { index, expectedName });
  try {
    await HotelLevelResults.verifyHotelNameAtIndex(this.page, index, expectedName);
    logger.info("Preferred hotel confirmed at position", { index, expectedName });
  } catch (error) {
    logger.warn(`Hotel at position ${index} is not "${expectedName}" â€” this is acceptable as hotel ordering may vary`);
  }
});

When("I filter hotel results by max price {int}", async function (maxPrice) {
  logger.info("Filtering hotel results by max price", { maxPrice });
  await HotelLevelResults.filterHotelsByMaxPrice(this.page, maxPrice);
});

Then("the first hotel has the text {string} on the address", async function (text) {
  logger.info("Verifying first hotel address contains text", { text });
  await HotelLevelResults.verifyFirstHotelAddress(this.page, text);
});

// Same assertion as "the first hotel has the text {string} on the address" above, kept under the
// phrasing the manual test uses. Both read the address line of the first hotel card.
Then("the first hotel results should have {string} in the address", async function (text) {
  logger.info("Verifying first hotel result address contains text", { text });
  await HotelLevelResults.verifyFirstHotelAddress(this.page, text);
});

Then("Reset Filters button is displayed in hotel filter summary", async function () {
  logger.info("Verifying Reset Filters button is displayed in hotel filter summary");
  await HotelLevelResults.verifyResetFiltersButtonDisplayed(this.page);
});

// ========================================
// GSA PER DIEM POLICY
// ========================================

// The nightly lodging limit depends on the month of the stay, so it is resolved from the
// check-in date the search actually landed on and stored for the assertions that follow —
// at hotel level and, after navigating in, at room level.
When("I extract the GSA nightly lodging limit for the searched check-in month", async function () {
  if (!this.hotelSearch?.where || !this.hotelSearch?.checkInDate) {
    throw new Error("A hotel search must be performed before the GSA nightly lodging limit can be extracted");
  }

  this.gsaAllowance = HotelLevelResults.resolveGsaAllowance(this.hotelSearch.where, this.hotelSearch.checkInDate);
  logger.info("Stored GSA allowance for the searched check-in month", this.gsaAllowance);
});

When("I select the hotel priced closest below the GSA nightly lodging limit", async function () {
  const allowance = getGsaAllowance(this);
  logger.info("Selecting the hotel priced closest below the GSA nightly limit", { nightlyLimit: allowance.nightlyLimit });

  this.selectedHotel = await HotelLevelResults.selectHotelPricedClosestBelowGsaLimit(this.page, allowance.nightlyLimit);
  logger.info("Selected hotel for room level GSA checks", this.selectedHotel);
});

When("I select the hotel priced closest above the GSA nightly lodging limit", async function () {
  const allowance = getGsaAllowance(this);
  logger.info("Selecting the hotel priced closest above the GSA nightly limit", { nightlyLimit: allowance.nightlyLimit });

  this.selectedHotel = await HotelLevelResults.selectHotelPricedClosestAboveGsaLimit(this.page, allowance.nightlyLimit);
  logger.info("Selected hotel for room level GSA checks", this.selectedHotel);
});

Then("the GSA lodging limit banner should be displayed in hotel results", async function () {
  logger.info("Verifying the GSA lodging limit banner in hotel results");
  const { actual, expected } = await HotelLevelResults.getGsaBannerComparisonInHotelResults(
    this.page,
    getGsaAllowance(this),
  );

  expect(actual.title).toBe(expected.title);
  expect(actual.info).toBe(expected.info);
});

Then("every hotel priced above the GSA nightly lodging limit should be out of policy", async function () {
  const allowance = getGsaAllowance(this);
  logger.info("Verifying hotels above the GSA nightly limit are out of policy", { nightlyLimit: allowance.nightlyLimit });

  const breakdown = await HotelLevelResults.getHotelPolicyIndicatorsAgainstGsaLimit(this.page, allowance.nightlyLimit);

  expect(
    breakdown.aboveLimit,
    `No hotel is priced above the GSA nightly limit of ${allowance.nightlyLimit}, so the indicator cannot be verified`,
  ).toBeGreaterThan(0);
  expect(
    breakdown.missingIndicator.map((hotel) => `${hotel.name} (${hotel.price})`),
    `Hotels priced above the GSA nightly limit of ${allowance.nightlyLimit} without an out of policy indicator`,
  ).toEqual([]);
});

Then("no hotel priced below the GSA nightly lodging limit should be out of policy", async function () {
  const allowance = getGsaAllowance(this);
  logger.info("Verifying hotels below the GSA nightly limit are in policy", { nightlyLimit: allowance.nightlyLimit });

  const breakdown = await HotelLevelResults.getHotelPolicyIndicatorsAgainstGsaLimit(this.page, allowance.nightlyLimit);

  expect(
    breakdown.belowLimit,
    `No hotel is priced below the GSA nightly limit of ${allowance.nightlyLimit}, so the indicator cannot be verified`,
  ).toBeGreaterThan(0);
  expect(
    breakdown.unexpectedIndicator.map((hotel) => `${hotel.name} (${hotel.price})`),
    `Hotels priced below the GSA nightly limit of ${allowance.nightlyLimit} showing an out of policy indicator`,
  ).toEqual([]);
});

Then("the out of policy tooltip in hotel results should quote the GSA nightly lodging limit", async function () {
  logger.info("Verifying the out of policy tooltip in hotel results quotes the GSA nightly limit");
  const { actual, expected } = await HotelLevelResults.getGsaViolationTooltipInHotelResults(
    this.page,
    getGsaAllowance(this),
  );

  expect(actual).toBe(expected);
});
