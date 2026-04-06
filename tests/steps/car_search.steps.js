require("module-alias/register");
const { When, setDefaultTimeout } = require("@cucumber/cucumber");
const { CarSearch } = require("../../src/dsl");
const logger = require("@utils/logger").child("CarSearch");

setDefaultTimeout(120000);

// ========================================
// WHEN STEPS - CAR SEARCH
// ========================================

When("I search for a car at {string} with {int} months ahead", async function (place, monthsAhead) {
  logger.info("Searching for car", { place, monthsAhead });
  await CarSearch.searchCarByPlace(this.page, place, monthsAhead);
});
When("I search for a car at {string}", async function (place) {
  logger.info("Searching for car", { place });
  await CarSearch.searchCarByPlace(this.page, place);
});

When("I search for a car at {string} with rental agency {string} and {int} months ahead", async function (place, agencyName, monthsAhead) {
  logger.info("Searching for car with agency", { place, agencyName, monthsAhead });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, place, agencyName, monthsAhead);
});

When("I search for a car at {string} with rental agency {string}", async function (place, agencyName) {
  logger.info("Searching for car with agency", { place, agencyName });
  await CarSearch.searchCarByPlaceAndRentalAgency(this.page, place, agencyName);
});

When("I search for a car from {string} to {string} with {int} months ahead", async function (pickupLocation, dropoffLocation, monthsAhead) {
  logger.info("Searching for car with different pickup and dropoff locations", { pickupLocation, dropoffLocation, monthsAhead });
  await CarSearch.searchCarWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation, monthsAhead);
});

When("I search for a car from {string} to {string}", async function (pickupLocation, dropoffLocation) {
  logger.info("Searching for car with different pickup and dropoff locations", { pickupLocation, dropoffLocation });
  await CarSearch.searchCarWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation);
});

When("I select rental agency {string}", async function (agencyName) {
  logger.info("Selecting rental agency", { agencyName });
  await CarSearch.selectRentalAgencyByName(this.page, agencyName);
});

// ========================================
// WHEN STEPS - CAR SEARCH EDIT
// ========================================

When("I edit the car search from {string} to {string} with {int} months ahead", async function (pickupLocation, dropoffLocation, monthsAhead) {
  logger.info("Editing car search with different pickup and dropoff locations", { pickupLocation, dropoffLocation, monthsAhead });
  await CarSearch.editCarSearchWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation, monthsAhead);
});

When("I edit the car search from {string} to {string}", async function (pickupLocation, dropoffLocation) {
  logger.info("Editing car search with different pickup and dropoff locations", { pickupLocation, dropoffLocation });
  await CarSearch.editCarSearchWithDifferentDropoffLocation(this.page, pickupLocation, dropoffLocation);
});
