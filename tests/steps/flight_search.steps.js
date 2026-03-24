require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
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

When("I search for a round trip flight from {string} to {string}", async function (from, to) {
  logger.info('Searching for round trip flight', { from, to });
  await FlightSearch.searchFlightRoundTrip(this.page, { from, to });
});

When("I search for a flight by schedule from {string} to {string}", async function (from, to) {
  logger.info('Searching for flight by schedule', { from, to });
  await FlightSearch.searchFlightBySchedule(this.page, { from, to });
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
