require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { HotelSearch } = require("../../src/dsl");
const logger = require("@utils/logger").child("HotelSearch");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - HOTEL SEARCH
// ========================================

When("I search for a hotel in {string} for {int} night(s)", async function (location, nights) {
  logger.info("Searching for hotel", { location, nights });
  await HotelSearch.searchHotelByNights(this.page, { where: location, nights: nights });
});

When("I search for a hotel in {string} for {int} night(s) with {int} rooms", async function (location, nights, rooms) {
  logger.info("Searching for hotel with multiple rooms", { location, nights, rooms });
  await HotelSearch.searchHotelMultiRoom(this.page, { where: location, nights, rooms });
});

// ========================================
// THEN STEPS - HOTEL SEARCH
// ========================================

Then("the hotel search location should be pre-populated with {string}", async function (expectedAirport) {
  logger.info("Verifying hotel search location is pre-populated", { expectedAirport });
  await HotelSearch.verifyHotelSearchPrePopulated(this.page, expectedAirport);
});
