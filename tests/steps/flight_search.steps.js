require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { FlightSearch } = require("../../src/dsl");
const logger = require("@utils/logger").child('FlightSearch');

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - FLIGHT SEARCH
// ========================================

When("I search for a one way flight from {string}", async function (routeKey) {
  logger.info('Searching for one-way flight', { routeKey });
  await FlightSearch.searchFlightOneWay(this.page, routeKey);
});

When("I search for a one way flight from {string} to {string}", async function (from, to) {
  logger.info('Searching for one-way flight', { from, to });
  await FlightSearch.searchFlightOneWay(this.page, { from, to });
});

When("I search for a one way flight from {string} to {string} on a day that is not Friday or Saturday", async function (from, to) {
  logger.info('Searching for one-way flight avoiding Friday/Saturday departure', { from, to });
  await FlightSearch.searchOneWayAvoidingWeekdays(this.page, from, to, ["friday", "saturday"]);
});

When('I search for a same day one way flight from {string} to {string}', async function (from, to) {
  logger.info('Searching for same-day one-way flight', { from, to });
  await FlightSearch.searchFlightOneWaySameDay(this.page, { from, to });
});

When('I search for a same day round trip flight from {string} to {string}', async function (from, to) {
  logger.info('Searching for same-day round-trip flight', { from, to });
  await FlightSearch.searchFlightRoundTripSameDay(this.page, { from, to });
});

When("I search for a one way flight from {string} to {string} on the {int} {string} of next month", async function (from, to, nth, dayOfWeek) {
  logger.info('Searching for one-way flight on specific weekday of next month', { from, to, nth, dayOfWeek });
  await FlightSearch.searchOneWayOnNthWeekday(this.page, from, to, dayOfWeek, nth);
});

When("I search for a round trip flight from {string} to {string}", async function (from, to) {
  logger.info('Searching for round trip flight', { from, to });
  await FlightSearch.searchFlightRoundTrip(this.page, { from, to });
});

When("I search for a round trip flight from {string} to {string} with outbound on a {string} and inbound the next day", async function (from, to, dayOfWeek) {
  logger.info('Searching for round trip flight on Nth weekday with next-day return', { from, to, dayOfWeek });
  await FlightSearch.searchRoundTripOnNthWeekday(this.page, from, to, dayOfWeek, 1);
});

When("I click the search button", async function () {
  logger.info('Clicking the trip search button');
  await FlightSearch.clickSearchButton(this.page);
});

When("I click the search button from the cart", async function () {
  logger.info('Clicking the flight search button from cart context');
  await FlightSearch.clickSearchButtonFromCart(this.page);
});

When('I search for a round trip flight from {string} to {string} with preferred carrier {string}', async function (from, to, carrier) {
  logger.info('Searching for round trip flight with preferred carrier', { from, to, carrier });
  await FlightSearch.searchFlightRoundTripWithPreferredCarrier(this.page, { from, to }, carrier);
});

When('I search for a one way flight from {string} to {string} with preferred carrier {string}', async function (from, to, carrier) {
  logger.info('Searching for one-way flight with preferred carrier', { from, to, carrier });
  await FlightSearch.searchFlightOneWayWithPreferredCarrier(this.page, { from, to }, carrier);
});

When('I search for a one way flight from {string} to {string} with departure time {string}', async function (from, to, timePreference) {
  logger.info('Searching for one-way flight with departure time preference', { from, to, timePreference });
  await FlightSearch.searchFlightOneWayWithDepartureTime(this.page, { from, to }, timePreference);
});

When('I search for a round trip {string} class flight from {string} to {string}', async function (cabinClass, from, to) {
  logger.info('Searching for round trip flight with cabin class', { cabinClass, from, to });
  await FlightSearch.searchFlightRoundTripWithCabinClass(this.page, { from, to }, cabinClass);
});

When("I edit the flight search from {string} to {string}", async function (from, to) {
  logger.info('Editing flight search in modal', { from, to });
  await FlightSearch.editFlightSearch(this.page, from, to);
});

When("I edit the flight search from {string} to {string} with the same dates as the hotel search", async function (from, to) {
  logger.info('Editing flight search in modal with hotel search dates', {
    from,
    to,
    hotelSearch: this.hotelSearch,
  });

  if (!this.hotelSearch?.checkInDate || !this.hotelSearch?.checkOutDate) {
    throw new Error('hotelSearch.checkInDate and hotelSearch.checkOutDate must be set before editing flight search with hotel dates');
  }

  this.editedFlightSearch = await FlightSearch.editFlightSearch(this.page, from, to, {
    departureDate: this.hotelSearch.checkInDate,
    returnDate: this.hotelSearch.checkOutDate,
  });
});

When('I click edit search and wait for the {string} search mode option', async function (searchMode) {
  logger.info('Opening edit flight search', { searchMode });
  await FlightSearch.clickEditSearchAndWaitForSearchMode(this.page, searchMode);
});

When('I click edit search', async function () {
  logger.info('Opening edit flight search');
  await FlightSearch.clickEditSearch(this.page);
});

When('I close the edit search drawer', async function () {
  logger.info('Closing the edit search drawer');
  await FlightSearch.closeEditSearch(this.page);
});

When('I change the search type to {string} in the edit flight search', async function (searchMode) {
  logger.info('Changing edit flight search mode', { searchMode });
  await FlightSearch.changeSearchTypeInEditFlightSearch(this.page, searchMode);
});

When('I change the search type to {string} and update dates in the edit flight search', async function (searchMode) {
  logger.info('Changing edit flight search mode and updating dates', { searchMode });
  this.editedFlightSearch = await FlightSearch.changeSearchTypeAndUpdateDatesInEditFlightSearch(this.page, searchMode);
});

When('I change the departure location to {string} in the edit flight search', async function (from) {
  logger.info('Changing departure location in edit flight search', { from });
  await FlightSearch.changeDepartureLocationInEditSearch(this.page, from);
});

When('I click advanced search in the flight search form', async function () {
  logger.info('Opening advanced flight search');
  await FlightSearch.openAdvancedSearch(this.page);
});

When('I select {string} in the flight search stops dropdown', async function (stopsOption) {
  logger.info('Selecting flight stops option', { stopsOption });
  await FlightSearch.selectStopsOption(this.page, stopsOption);
});

Then('free text {string} should not be accepted in the flight search stops dropdown', async function (freeText) {
  logger.info('Verifying flight stops dropdown rejects free text', { freeText });
  await FlightSearch.verifyStopsDropdownRejectsFreeText(this.page, freeText);
});

When('I search from the edit flight search form', async function () {
  logger.info('Submitting edit flight search form');
  await FlightSearch.searchFromEditFlightSearch(this.page);
});

When("I search for a flight by schedule from {string} to {string}", async function (from, to) {
  logger.info('Searching for flight by schedule', { from, to });
  await FlightSearch.searchFlightBySchedule(this.page, { from, to });
});

When('I search for a {string} class flight by schedule from {string} to {string}', async function (cabinClass, from, to) {
  logger.info('Searching for flight by schedule with cabin class', { cabinClass, from, to });
  await FlightSearch.searchFlightByScheduleWithCabinClass(this.page, { from, to }, cabinClass);
});

When('I search for a round trip flight by schedule from {string} to {string} with outbound cabin {string} and return cabin {string}', async function (from, to, outboundCabin, returnCabin) {
  logger.info('Searching for by-schedule round trip with per-leg cabins', { from, to, outboundCabin, returnCabin });
  await FlightSearch.searchFlightByScheduleRoundTripWithCabins(this.page, from, to, outboundCabin, returnCabin);
});

When('I search for a flight by schedule from {string} to {string} with preferred carrier {string} in the edit flight search', async function (from, to, carrier) {
  logger.info('Searching from edit flight search by schedule with preferred carrier', { from, to, carrier });
  await FlightSearch.searchFlightByScheduleWithPreferredCarrierInEditSearch(this.page, from, to, carrier);
});

When('I search for a flight by schedule from {string} to {string} with preferred carrier {string}', async function (from, to, carrier) {
  logger.info('Searching for by-schedule flight with preferred carrier', { from, to, carrier });
  await FlightSearch.searchFlightByScheduleWithPreferredCarrier(this.page, from, to, carrier);
});

When('I search for a flight by schedule from {string} to {string} with preferred carrier {string} and stops {string}', async function (from, to, carrier, stopsOption) {
  logger.info('Searching for by-schedule flight with preferred carrier and stops filter', { from, to, carrier, stopsOption });
  await FlightSearch.searchFlightByScheduleWithPreferredCarrierAndStops(this.page, from, to, carrier, stopsOption);
});

When("I search for a random one way flight", async function () {
  logger.info('Searching for random one-way flight');
  await FlightSearch.searchOneWayRandomFlight(this.page);
});

When("I search for a random one way flight in {string}", async function (region) {
  logger.info('Searching for random one-way flight', { region });
  await FlightSearch.searchOneWayRandomFlight(this.page, region);
});

When("I search for a random round trip flight", async function () {
  logger.info('Searching for random round trip flight');
  await FlightSearch.searchRoundTripRandomFlight(this.page);
});

When("I search for a random round trip flight in {string}", async function (region) {
  logger.info('Searching for random round trip flight', { region });
  await FlightSearch.searchRoundTripRandomFlight(this.page, region);
});

When("I search for a multi-city flight with legs {string} and {string} and {string}", async function (leg1, leg2, leg3) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2, leg3].map(parseLeg);
  logger.info('Searching for multi-city flight', { legs });
  await FlightSearch.searchFlightMultiCity(this.page, legs);
});

When("I search for a multi-city flight with legs {string} and {string} and {string} with a longer stay after the first leg", async function (leg1, leg2, leg3) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2, leg3].map(parseLeg);
  logger.info('Searching for multi-city flight with a longer stay after the first leg', { legs });
  await FlightSearch.searchFlightMultiCityWithLongerFirstStay(this.page, legs);
});

When("I search for a multi-city by-schedule flight with legs {string} and {string} and {string}", async function (leg1, leg2, leg3) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2, leg3].map(parseLeg);
  logger.info('Searching for multi-city by-schedule flight', { legs });
  await FlightSearch.searchFlightMultiCity(this.page, legs, { searchType: 'bySchedule' });
});

When("I search for a multi-city flight with legs {string} and {string} and {string} and {string}", async function (leg1, leg2, leg3, leg4) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2, leg3, leg4].map(parseLeg);
  logger.info('Searching for multi-city flight', { legs });
  await FlightSearch.searchFlightMultiCity(this.page, legs);
});

When("I search for a multi-city flight with legs {string} and {string}", async function (leg1, leg2) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2].map(parseLeg);
  logger.info('Searching for multi-city flight', { legs });
  await FlightSearch.searchFlightMultiCity(this.page, legs);
});

// Compact-dates variant: legs a few days apart (near-term) instead of the default wider spread,
// so short-haul multi-city routes return bookable results.
When("I search for a multi-city flight with legs {string} and {string} with close dates", async function (leg1, leg2) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2].map(parseLeg);
  logger.info('Searching for multi-city flight with close leg dates', { legs });
  await FlightSearch.searchFlightMultiCityWithCloseDates(this.page, legs);
});

When("I search for a multi-city flight with legs {string} and {string} with parallel car search", async function (leg1, leg2) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2].map(parseLeg);
  logger.info('Searching for multi-city flight with parallel car search', { legs });
  await FlightSearch.searchFlightMultiCityWithParallelCar(this.page, legs);
});

When("I search for a multi-city flight with legs {string} and {string} with cabin class {string} without clicking search button", async function (leg1, leg2, cabinClass) {
  const parseLeg = (leg) => {
    const parts = leg.toUpperCase().split('-');
    if (parts.length !== 2) throw new Error(`Invalid leg format "${leg}". Expected "FROM-TO".`);
    return { from: parts[0], to: parts[1] };
  };
  const legs = [leg1, leg2].map(parseLeg);
  logger.info('Setting up multi-city flight with cabin class without clicking search', { legs, cabinClass });
  await FlightSearch.setupMultiCityFlightWithCabinClassWithoutSearch(this.page, legs, cabinClass);
});

Then("the search type should be {string}", async function (searchType) {
  logger.info('Verifying search type is selected', { searchType });
  await FlightSearch.verifySearchTypeSelected(this.page, searchType);
});

When("I remove the last flight leg from the multi-city search", async function () {
  logger.info('Removing the last flight leg from the multi-city search');
  await FlightSearch.removeLastFlightLeg(this.page);
});

When("I search for a round trip flight from {string} to {string} with advanced search and return date type {string} and time {string} and parallel hotel", async function (from, to, returnDateType, returnFlightTime) {
  logger.info('Searching for advanced round trip flight with parallel hotel', { from, to, returnDateType, returnFlightTime });
  await FlightSearch.searchRoundTripAdvanced(this.page, from, to, {
    returnDateType,
    returnFlightTime,
    parallelHotel: true,
  });
});

When("I search for a round trip flight from {string} to {string} with advanced search as return date type {string} with parallel hotel", async function (from, to, returnDateType) {
  logger.info('Searching for advanced round trip flight with parallel hotel', { from, to, returnDateType });
  await FlightSearch.searchRoundTripAdvanced(this.page, from, to, {
    returnDateType,
    parallelHotel: true,
  });
});

// ========================================
// WHEN STEPS - FLIGHT TAB NAVIGATION
// ========================================

When("I click on the flight tab", async function () {
  logger.info('Clicking on flight tab');
  await FlightSearch.clickFlightTab(this.page);
});

When("I click on the flight tab and check Allow nearby airports", async function () {
  logger.info('Clicking on flight tab and checking Allow nearby airports checkbox');
  await FlightSearch.clickFlightTabAndCheckNearbyAirports(this.page);
});

When("I click on the flight tab and check Add hotel to this trip", async function () {
  logger.info('Clicking on flight tab and checking Add hotel to this trip checkbox');
  await FlightSearch.clickFlightTabAndCheckParallelHotel(this.page);
});

When("I click on the flight tab and uncheck Add hotel to this trip and Add car to this trip", async function () {
  logger.info('Clicking on flight tab and unchecking Add hotel to this trip and Add car to this trip checkboxes');
  await FlightSearch.clickFlightTabAndUncheckParallelHotelAndCar(this.page);
});

When("I search for a round trip flight from {string} to {string} without clicking search button", async function (from, to) {
  logger.info('Filling round-trip flight search without clicking search', { from, to });
  await FlightSearch.searchFlightRoundTripWithoutSearch(this.page, { from, to });
});

When("I fill in a round trip {string} class flight from {string} to {string} without clicking search button", async function (cabinClass, from, to) {
  logger.info('Filling round-trip flight search with cabin class without clicking search', { cabinClass, from, to });
  await FlightSearch.searchFlightRoundTripWithCabinClassWithoutSearch(this.page, { from, to }, cabinClass);
});

When("I edit the parallel hotel destination to {string}", async function (destination) {
  logger.info('Editing the parallel hotel destination', { destination });
  await FlightSearch.editParallelHotelDestination(this.page, destination);
});

// ========================================
// THEN STEPS - FLIGHT SEARCH VERIFICATION
// ========================================

Then("the car search checkbox should be checked by default", async function () {
  logger.info('Verifying car search checkbox is checked by default');
  await FlightSearch.verifyCarSearchCheckboxChecked(this.page);
});

Then('the "Add Hotel to this trip" parallel option should be visible on the flight tab', async function () {
  logger.info('Verifying the "Add Hotel to this trip" parallel option is visible on the flight tab');
  await FlightSearch.verifyParallelHotelCheckboxVisible(this.page);
});

Then('the "Add Hotel to this trip" parallel option should be checked by default on the flight tab', async function () {
  logger.info('Verifying the "Add Hotel to this trip" parallel option is checked by default on the flight tab');
  await FlightSearch.verifyParallelHotelCheckboxCheckedByDefault(this.page);
});

Then('the "Allow nearby airports" checkbox in the advanced flight search should be checked', async function () {
  logger.info('Verifying the "Allow nearby airports" checkbox is checked');
  await FlightSearch.verifyAllowNearbyAirportsCheckboxIsChecked(this.page);
});

Then('{string} message should not be displayed anywhere in search page', async function (message) {
  logger.info('Verifying validation message is not displayed on the search page', { message });
  await FlightSearch.verifyValidationMessageNotDisplayedOnSearchPage(this.page, message);
});

Then("the search loading screen should be visible", async function () {
  logger.info('Verifying the search loading screen is visible');
  await FlightSearch.verifySearchLoadingScreenVisible(this.page);
});

When("I search for a round trip flight from {string} to {string} with parallel car search", async function (from, to) {
  logger.info('Searching for round trip flight with parallel car search', { from, to });
  await FlightSearch.searchFlightRoundTripWithParallelCar(this.page, { from, to });
});

// ========================================
// WHEN STEPS - TIME FRAME SELECTION
// ========================================

When('I select time frame {string} for both legs', async function (timeFrameName) {
  const resolved = FlightSearch.resolveTimeFrame(timeFrameName);
  this.selectedTimeFrame = resolved;
  logger.info('Selecting time frame for both legs', this.selectedTimeFrame);
  await FlightSearch.selectTimeFrameForBothLegs(this.page, resolved.label);
});

When('I set the time frame for both legs and search', async function () {
  // Anytime is restricted for this user, so pick a specific valid frame before searching.
  const resolved = FlightSearch.resolveTimeFrame('afternoon');
  this.selectedTimeFrame = resolved;
  logger.info('Setting the time frame for both legs and searching', { timeFrame: resolved.label });
  await FlightSearch.setTimeFrameForBothLegsAndSearch(this.page, resolved.label);
});

Then('both departures time frame fields display message {string} and verifying Anytime is restricted', async function (message) {
  logger.info('Verifying both legs show the time-frame required message and Anytime is restricted', { message });
  await FlightSearch.verifyBothLegsFlightTimeRequired(this.page, message);
});

Then('the Anytime time-frame restriction is shown for the both legs', async function () {
  // After editing the search the chosen frame is restored, so the restriction manifests as the
  // "Anytime" option being absent from both legs' time-frame dropdowns.
  logger.info('Verifying the Anytime time-frame restriction is shown for both legs');
  await FlightSearch.verifyAnytimeRestrictedForBothLegs(this.page);
});
