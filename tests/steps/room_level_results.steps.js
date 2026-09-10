require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { RoomLevelResults } = require("../../src/dsl");
const { ResultsPage } = require("../../src/pages/ResultsPage");
const Cart = require("../../src/dsl/Cart");
const RoomLevelResultsPage = require("../../src/pages/RoomLevelResultsPage");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("RoomResults");
const { getGsaAllowance, getHotelListScrollOffsetAtSelection } = require("../support/scenarioState");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - ROOM SELECTION
// ========================================

When("I add a refundable room to my cart", async function () {
  logger.info("Adding refundable room to cart");
  await RoomLevelResults.addRefundableHotelRoomLevelToCart(this.page);
  await Cart.expectBookingStatusToBe("Pending booking", { page: this.page });
  await Cart.expectHotelToBeRefundableInCart(this.page);
});

When("I add a refundable room to my cart alongside an existing booked quote", async function () {
  logger.info("Adding refundable room to cart alongside an existing booked quote");
  await RoomLevelResults.addRefundableHotelRoomLevelToCart(this.page);
  await Cart.expectHotelToBeRefundableInCart(this.page);
});

When("I add the first available room to my cart", async function () {
  logger.info("Adding first available room to cart");
  await RoomLevelResults.addFirstHotelRoomLevelToCart(this.page);
});

When("I add the first room to my cart from the terms and conditions dialog", async function () {
  logger.info("Adding first room to cart from the terms and conditions dialog");
  await RoomLevelResults.addRoomToCartFromTermsAndConditions(this.page);
});

When("I add room called {string} to cart", async function (roomName) {
  logger.info("Adding room to cart by name", { roomName });
  await RoomLevelResults.addRoomByNameToCart(this.page, roomName);
  await Cart.expectBookingStatusToBe("Pending booking", { page: this.page });
});

When("I wait for the first add to trip button to be visible in room level results", async function () {
  logger.info("Waiting for first add to trip button to be visible in room level results");
  const roomLevelResultsPage = getPageObject(this.page, RoomLevelResultsPage);
  const resultsPage = getPageObject(this.page, ResultsPage);
  await roomLevelResultsPage.waitForViewHotelOnMapText();
  await resultsPage.scrollToFirstAddToTripButton();
  await resultsPage.waitForAddToTripText();
});

When("I wait for view hotel on map button to be visible in room level results", async function () {
  logger.info("Waiting for view hotel on map button in room level results");
  await RoomLevelResults.waitForViewHotelOnMapButtonInRoomLevelResults(this.page);
});

When("I click the view on map button in room level", async function () {
  logger.info("Clicking view hotel on map button in room level results");
  await RoomLevelResults.clickViewOnMap(this.page);
});

// ========================================
// WHEN STEPS - EXTRACTION
// ========================================

When("I extract cancellation policy from first room level results", async function () {
  logger.info("Extracting cancellation policy from first room level results");
  this.roomLevelCancellationPolicy = await RoomLevelResults.extractCancellationPolicy(this.page);
  logger.info("Extracted cancellation policy from room level results", { roomLevelCancellationPolicy: this.roomLevelCancellationPolicy });
});

When("I extract the price from room level results", async function () {
  logger.info("Extracting price from room level results");
  this.roomLevelPrice = await RoomLevelResults.extractRoomLevelPrice(this.page);
  if (!this.extractedPrices) this.extractedPrices = [];
  this.extractedPrices.push(this.roomLevelPrice);
  logger.info("Stored room level price", { roomLevelPrice: this.roomLevelPrice });
});

When("I check terms and conditions in room level", async function () {
  logger.info("Clicking terms and conditions on first room");
  this.termsDialogVisible = await RoomLevelResults.checkTermsAndConditions(this.page);
});

When("I filter room results by deposit not required", async function () {
  logger.info("Filtering room results by deposit not required");
  await RoomLevelResults.filterRoomsByDepositNotRequired(this.page);
});

When("I filter room results by deposit required", async function () {
  logger.info("Filtering room results by deposit required");
  await RoomLevelResults.filterRoomsByDeposit(this.page);
});

When("I filter room results by refundable", async function () {
  logger.info("Filtering room results by refundable");
  await RoomLevelResults.filterRoomsByRefundable(this.page);
});

Then("deposit required is displayed in the first room", async function () {
  logger.info("Verifying the Deposit Required note is displayed on the first room");
  await RoomLevelResults.verifyRoomDepositRequired(this.page, 1);
});

When("I verify the room price appears in the terms and conditions", async function () {
  if (this.roomLevelPrice === undefined) {
    throw new Error(
      "No room level price stored. Run 'When I extract the price from room level results' before this step."
    );
  }
  logger.info("Verifying room price appears in terms and conditions", { price: this.roomLevelPrice });
  await RoomLevelResults.verifyPriceInTermsAndConditions(this.page, this.roomLevelPrice);
});

Then("terms and conditions are displayed", async function () {
  if (this.termsDialogVisible === undefined) {
    throw new Error("Terms dialog state not recorded. Run 'When I check terms and conditions in room level' before this step.");
  }
  if (!this.termsDialogVisible) {
    throw new Error("Terms and conditions dialog was not visible after clicking the button.");
  }
  logger.info("Terms and conditions dialog confirmed visible");
});

Then("the room level terms and conditions should include {string}", async function (expectedText) {
  logger.info("Verifying room level terms and conditions include expected text", { expectedText });
  await RoomLevelResults.verifyTextInTermsAndConditions(this.page, expectedText);
});

Then("the booking fee from hotel level should match the booking fee from room level", async function () {
  if (this.hotelLevelPrice === undefined) {
    throw new Error("No hotel level price stored. Run 'I extract the price from hotel level results' before this step.");
  }
  if (this.roomLevelPrice === undefined) {
    throw new Error("No room level price stored. Run 'I extract the price from room level results' before this step.");
  }
  logger.info("Comparing booking fees", { hotelLevelPrice: this.hotelLevelPrice, roomLevelPrice: this.roomLevelPrice });
  await RoomLevelResults.compareBookingFees(this.page, this.hotelLevelPrice, this.roomLevelPrice);
});

// ========================================
// THEN STEPS - ASSERTIONS
// ========================================

Then("the cancellation policy in the cart should match the cancellation policy from room level results", async function () {
  if (!this.roomLevelCancellationPolicy) {
    throw new Error("No cancellation policy stored. Run 'I extract cancellation policy from first room level results' before this step.");
  }
  if (!this.cartCancellationPolicy) {
    throw new Error("No cart cancellation policy stored. Run 'I extract cancellation policy from cart' before this step.");
  }
  logger.info("Comparing cancellation policies", { roomResults: this.roomLevelCancellationPolicy, cart: this.cartCancellationPolicy });
  expect(this.cartCancellationPolicy).toBe(this.roomLevelCancellationPolicy);
});

Then("I should see member rates displayed in room level results", async function () {
  logger.info("Verifying member rates are displayed in room level results");
  const isVisible = await RoomLevelResults.verifyMemberRatesDisplayed(this.page);
  logger.info("Member rates verification result", { isVisible });
  expect(isVisible).toBe(true);
});

Then("I should see a tag with the text {string} in room level results", async function (tagText) {
  logger.info("Verifying member badge tag text in room level results", { tagText });
  await RoomLevelResults.verifyMemberBadgeTagText(this.page, tagText);
});

Then("the {string} loyalty badge should be visible in room level results", async function (chainName) {
  logger.info("Verifying hotel loyalty badge is visible in room level results", { chainName });
  const label = await RoomLevelResults.verifyLoyaltyBadgeInRoomLevel(this.page, chainName);
  logger.info("Hotel loyalty badge found in room level results", { chainName, label });
});

Then("the CO2 emissions should be displayed in room level results", async function () {
  logger.info("Verifying CO2 emissions are displayed in room level results");
  const result = await RoomLevelResults.verifyCO2InRoomLevel(this.page);
  logger.info("CO2 verification result in room level", { visible: result.visible, value: result.value });
  expect(result.visible).toBe(true);
});

Then("the {string} supplier logo should be visible in room level results", async function (supplierName) {
  logger.info("Verifying supplier logo is visible in room level results", { supplierName });
  const isVisible = await RoomLevelResults.verifySupplierLogo(this.page, supplierName);
  if (!isVisible) throw new Error(`Supplier logo for "${supplierName}" not visible in room level results`);
});

Then("the {string} supplier logo should not be visible in room level results", async function (supplierName) {
  logger.info("Verifying supplier logo is NOT visible in room level results", { supplierName });
  await RoomLevelResults.verifySupplierLogoNotVisible(this.page, supplierName);
});

Then("the member rate price should be lower than the regular price", async function () {
  logger.info("Comparing member rate price vs regular price");
  const comparison = await RoomLevelResults.compareMemberVsRegularPrice(this.page);
  logger.info("Price comparison result", comparison);
  expect(comparison.hasDiscount).toBe(true);
  expect(comparison.memberPrice).toBeLessThan(comparison.regularPrice);
});



Then("the room level results should display {int} nights", async function (nights) {
  logger.info(`Verifying ${nights} nights displayed in room level results`);
  await RoomLevelResults.verifyNightsCountInRoomLevel(this.page, nights);
});

// Sanity check on the room list's own counter: it must report at least one room, no more than its
// stated total, and stay under the given upper bound.
Then('I see that "Showing X of X Results" display a logical number of rooms that is smaller than {int} hotels', async function (maxCount) {
  logger.info("Verifying the room results count line reports a plausible number of rooms", { maxCount });
  const result = await RoomLevelResults.verifyRoomResultsCountIsBelow(this.page, maxCount);
  logger.info("Room results count line verified", result);
});

When("I click the first price breakdown button", async function () {
  logger.info("Clicking price details button to open price breakdown");
  await RoomLevelResults.clickPriceBreakdownButton(this.page);
});

When("I extract prices from the price breakdown", async function () {
  logger.info("Extracting prices from price breakdown dialog");
  const values = await RoomLevelResults.extractPriceBreakdownValues(this.page);
  this.priceBreakdownNight = values.nightPrice;
  this.priceBreakdownSubtotal = values.subtotal;
  this.priceBreakdownTotal = values.total;
  // Also published under the surface-agnostic names the shared "total price is price per night x N"
  // check reads, so the same assertion works here and off the cart's More Details drawer.
  this.pricePerNight = values.nightPrice;
  this.totalPrice = values.total;
  logger.info("Stored price breakdown values", values);
});

Then("the room level price should match the price breakdown total", async function () {
  if (this.roomLevelPrice === undefined) {
    throw new Error("No room level price stored. Run 'When I extract the price from room level results' before this step.");
  }
  if (this.priceBreakdownTotal === undefined) {
    throw new Error("No price breakdown total stored. Run 'When I extract prices from the price breakdown' before this step.");
  }
  logger.info("Comparing room level price with price breakdown total", {
    roomLevelPrice: this.roomLevelPrice,
    priceBreakdownTotal: this.priceBreakdownTotal,
  });
  const diff = Math.abs(this.roomLevelPrice - this.priceBreakdownTotal);
  expect(diff).toBeLessThanOrEqual(1);
});

Then("the night price should match the price breakdown total", async function () {
  if (this.priceBreakdownNight === undefined) {
    throw new Error("No price breakdown night price stored. Run 'When I extract prices from the price breakdown' before this step.");
  }
  if (this.priceBreakdownTotal === undefined) {
    throw new Error("No price breakdown total stored. Run 'When I extract prices from the price breakdown' before this step.");
  }
  logger.info("Comparing night price with price breakdown total", {
    priceBreakdownNight: this.priceBreakdownNight,
    priceBreakdownTotal: this.priceBreakdownTotal,
  });
  const diff = Math.abs(this.priceBreakdownNight - this.priceBreakdownTotal);
  expect(diff).toBeLessThanOrEqual(1);
});

Then("the subtotal should match the price breakdown total", async function () {
  if (this.priceBreakdownSubtotal === undefined) {
    throw new Error("No price breakdown subtotal stored. Run 'When I extract prices from the price breakdown' before this step.");
  }
  if (this.priceBreakdownTotal === undefined) {
    throw new Error("No price breakdown total stored. Run 'When I extract prices from the price breakdown' before this step.");
  }
  logger.info("Comparing subtotal with price breakdown total", {
    priceBreakdownSubtotal: this.priceBreakdownSubtotal,
    priceBreakdownTotal: this.priceBreakdownTotal,
  });
  const diff = Math.abs(this.priceBreakdownSubtotal - this.priceBreakdownTotal);
  expect(diff).toBeLessThanOrEqual(1);
});

Then("the hotel level price should match the room level price", async function () {
  logger.info("Comparing hotel level price with room level price", {
    hotelLevelPrice: this.hotelLevelPrice,
    roomLevelPrice: this.roomLevelPrice,
  });

  const result = await RoomLevelResults.compareHotelAndRoomLevelPrices(
    this.page,
    this.hotelLevelPrice,
    this.roomLevelPrice,
  );

  logger.info("Price comparison succeeded", result);
  expect(result.difference).toBeLessThanOrEqual(0.01);
});

Then("the hotel map should open in room level results", async function () {
  logger.info("Verifying hotel map modal is visible in room level results");
  const markerSelector = await RoomLevelResults.verifyMapModalOpened(this.page);
  logger.info("Hotel marker rendered on the map", { markerSelector });
});

When("I filter room results by Wi-Fi amenity", async function () {
  logger.info("Filtering room results by Wi-Fi amenity");
  await RoomLevelResults.filterRoomsByWifi(this.page);
});

Then("only rooms with Wi-Fi should be displayed", async function () {
  logger.info("Verifying only rooms with Wi-Fi amenity are displayed");
  await RoomLevelResults.verifyWifiRoomsOnly(this.page);
});

When("I filter room results by breakfast included", async function () {
  logger.info("Filtering room results by breakfast included");
  await RoomLevelResults.filterRoomsByBreakfast(this.page);
});

Then("only rooms with breakfast should be displayed", async function () {
  logger.info("Verifying only rooms with breakfast amenity are displayed");
  await RoomLevelResults.verifyBreakfastRoomsOnly(this.page);
});

When("I click on price details button in room level results", async function () {
  logger.info("Clicking price details button in room level results");
  const roomLevelResultsPage = getPageObject(this.page, RoomLevelResultsPage);
  await roomLevelResultsPage.clickPriceDetailsButton();
});

Then("I see {string} in taxes and fees row", async function (currencySymbol) {
  logger.info("Verifying currency symbol in taxes and fees row", { currencySymbol });
  const rowText = await RoomLevelResults.getTaxesAndFeesRowText(this.page);
  logger.info("Taxes and fees row text", { rowText });
  expect(rowText).toContain(currencySymbol);
});

When("I close price details dialog", async function () {
  logger.info("Closing price details dialog");
  await RoomLevelResults.closePriceDetailsDialog(this.page);
});

When("I hover over info icon next to taxes and fees", async function () {
  logger.info("Hovering over info icon next to taxes and fees");
  const roomLevelResultsPage = getPageObject(this.page, RoomLevelResultsPage);
  await roomLevelResultsPage.hoverPayAtHotelInfoIcon();
});

Then("the {string} tooltip should be correct", async function (tooltipText) {
  logger.info("Verifying tooltip text", { expected: tooltipText });
  const roomLevelResultsPage = getPageObject(this.page, RoomLevelResultsPage);
  const actualText = await roomLevelResultsPage.getPayAtHotelTooltipText();
  logger.info("Tooltip text found", { actual: actualText });
  expect(actualText).toBe("Paid at the hotel");
});

Then("I see room level filter sections", async function () {
  logger.info("Verifying room level filter sections are visible");
  await RoomLevelResults.verifyRoomLevelFilters(this.page);
});

When("I apply room level filter {string} with option {string}", async function (filterName, optionText) {
  logger.info("Applying room level filter", { filterName, optionText });
  await RoomLevelResults.applyRoomFilter(this.page, filterName, optionText);
});

Then("handshake badge should be visible in room level results", async function () {
  logger.info("Verifying handshake agreement badge is visible in room level results");
  await RoomLevelResults.verifyHandshakeBadgeVisible(this.page);
});

Then("agreement badge should be visible on all rooms in room level results", async function () {
  logger.info("Verifying every room in room level results has the agreement badge");
  await RoomLevelResults.verifyAgreementBadgeOnAllRooms(this.page);
});

Then("the {string} filter tag should be visible in room level results", async function (tagText) {
  logger.info("Verifying room filter tag is visible", { tagText });
  await RoomLevelResults.verifyRoomFilterTag(this.page, tagText);
});

Then("the room level page should be displayed at the top", async function () {
  logger.info("Verifying room level page is displayed at the top");
  await RoomLevelResults.verifyRoomLevelPageAtTop(this.page, {
    scrollOffsetBeforeNavigation: getHotelListScrollOffsetAtSelection(this),
  });
});

When("I add the room marked as check cancellation policy", async function () {
  logger.info("Adding room with 'Check cancellation policy' label to cart");
  await RoomLevelResults.addCheckCancellationPolicyRoomToCart(this.page);
});

Then("I should see a provided by label in room level results", async function () {
  logger.info("Verifying 'Provided by' label is visible in room level results");
  await RoomLevelResults.verifyProviderLabelVisible(this.page);
});

When("I navigate back to hotel level results via breadcrumb", async function () {
  logger.info("Navigating back to hotel level results via breadcrumb");
  await RoomLevelResults.navigateBackViaBreakcrumb(this.page);
});

When("I filter room results by max price {int}", async function (maxPrice) {
  logger.info("Filtering room results by max price", { maxPrice });
  await RoomLevelResults.filterRoomsByMaxPrice(this.page, maxPrice);
});

// ========================================
// GSA PER DIEM POLICY
// ========================================

// The allowance was resolved at hotel level from the searched check-in month; room level
// must show the same limit and apply it to the rooms of the selected hotel.
Then("the GSA lodging limit banner should be displayed in room level results", async function () {
  logger.info("Verifying the GSA lodging limit banner in room level results");
  const { actual, expected } = await RoomLevelResults.getGsaBannerComparisonInRoomResults(
    this.page,
    getGsaAllowance(this),
  );

  expect(actual.title).toBe(expected.title);
  expect(actual.info).toBe(expected.info);
});

// Checked on the hotel already open. If that hotel has no room above the limit it cannot
// answer this, so the DSL falls back to the hotel priced closest above the limit.
Then("every room priced above the GSA nightly lodging limit should be out of policy", async function () {
  const allowance = getGsaAllowance(this);
  logger.info("Verifying rooms above the GSA nightly limit are out of policy", { nightlyLimit: allowance.nightlyLimit });

  const { breakdown, fallbackHotel } = await RoomLevelResults.getRoomsAboveGsaLimitWithFallback(
    this.page,
    allowance.nightlyLimit,
  );

  if (fallbackHotel) {
    this.selectedHotel = fallbackHotel;
    logger.info("Rooms above the GSA nightly limit were checked on a second hotel", fallbackHotel);
  }

  expect(
    breakdown.aboveLimit,
    `No room is priced above the GSA nightly limit of ${allowance.nightlyLimit} in any hotel checked, so the indicator cannot be verified`,
  ).toBeGreaterThan(0);
  expect(
    breakdown.missingIndicator.map((room) => `room ${room.index + 1} (${room.price})`),
    `Rooms priced above the GSA nightly limit of ${allowance.nightlyLimit} without an out of policy indicator`,
  ).toEqual([]);
});

Then("no room priced below the GSA nightly lodging limit should be out of policy", async function () {
  const allowance = getGsaAllowance(this);
  logger.info("Verifying rooms below the GSA nightly limit are in policy", { nightlyLimit: allowance.nightlyLimit });

  const breakdown = await RoomLevelResults.getRoomPolicyIndicatorsAgainstGsaLimit(this.page, allowance.nightlyLimit);

  expect(
    breakdown.belowLimit,
    `No room is priced below the GSA nightly limit of ${allowance.nightlyLimit}, so the indicator cannot be verified`,
  ).toBeGreaterThan(0);
  expect(
    breakdown.unexpectedIndicator.map((room) => `room ${room.index + 1} (${room.price})`),
    `Rooms priced below the GSA nightly limit of ${allowance.nightlyLimit} showing an out of policy indicator`,
  ).toEqual([]);
});

Then("the out of policy tooltip in room level results should quote the GSA nightly lodging limit", async function () {
  logger.info("Verifying the out of policy tooltip in room level results quotes the GSA nightly limit");
  const { actual, expected } = await RoomLevelResults.getGsaViolationTooltipInRoomResults(
    this.page,
    getGsaAllowance(this),
  );

  expect(actual).toBe(expected);
});
