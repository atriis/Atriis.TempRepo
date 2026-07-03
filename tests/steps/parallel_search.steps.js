require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { ParallelSearch } = require("@dsl");
const logger = require("@utils/logger").child("ParallelSearch");

setDefaultTimeout(120000);

// ========================================
// THEN STEPS - PARALLEL SEARCH ASSERTIONS
// ========================================

Then("the rental car hours should match the flight hours", async function () {
  logger.info("Verifying rental car pick-up/drop-off hours match the flight hours");
  await ParallelSearch.verifyCarHoursMatchFlightHours(this.page);
});

Then("the best sorting explanation tooltip should be displayed", async function () {
  logger.info("Verifying the best sorting explanation tooltip on flight results");
  await ParallelSearch.verifyBestSortingExplanation(this.page);
});

// ========================================
// WHEN STEPS - PARALLEL SEARCH
// ========================================

When("I search for a flight to {string} with a parallel hotel and an edited car in {string}", async function (destination, carLocation) {
  logger.info("Searching for a flight with a parallel hotel and an edited parallel car", { destination, carLocation });
  this.parallelSearch = await ParallelSearch.searchFlightWithParallelHotelAndEditedCar(this.page, {
    to: destination,
    carLocation,
  });
});

When("I search for a flight from {string} to {string} with an edited car in {string}", async function (origin, destination, carLocation) {
  logger.info("Searching for a flight with an edited parallel car (no hotel)", { origin, destination, carLocation });
  this.parallelSearch = await ParallelSearch.searchFlightAndEditCar(this.page, {
    from: origin,
    to: destination,
    carLocation,
  });
});

Then("the flight depart and return dates should match the entered dates", async function () {
  if (!this.parallelSearch) {
    throw new Error('No captured parallel search dates on world state. Run "I search for a flight to ... with a parallel hotel and an edited car in ..." before this assertion.');
  }
  logger.info("Verifying the flight depart and return dates are retained in the edit search", {
    expectedDepartureDate: this.parallelSearch.flightDepartDate,
    expectedReturnDate: this.parallelSearch.flightReturnDate,
  });
  await ParallelSearch.verifyFlightDatesRetained(this.page, {
    expectedDepartureDate: this.parallelSearch.flightDepartDate,
    expectedReturnDate: this.parallelSearch.flightReturnDate,
  });
});

Then("the car pick-up and drop-off dates should match the entered dates", async function () {
  if (!this.parallelSearch) {
    throw new Error('No captured parallel search dates on world state. Run "I search for a flight to ... with a parallel hotel and an edited car in ..." before this assertion.');
  }
  logger.info("Verifying the car pick-up and drop-off dates are retained in the edit search", {
    expectedPickupDate: this.parallelSearch.carPickupDate,
    expectedDropoffDate: this.parallelSearch.carDropoffDate,
  });
  await ParallelSearch.verifyCarDatesRetained(this.page, {
    expectedPickupDate: this.parallelSearch.carPickupDate,
    expectedDropoffDate: this.parallelSearch.carDropoffDate,
  });
});
