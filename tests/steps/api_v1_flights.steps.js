require("module-alias/register");

const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { ApiV1Flights } = require("@dsl");
const logger = require("@utils/logger").child("ApiV1Flights");

setDefaultTimeout(120000);

// Fixed test traveller for API V1 holds. The website sends guest travellers, not profile users.
const API_V1_TEST_TRAVELER = {
  title: "MR",
  firstName: "Qa",
  lastName: "Tester",
  birthDate: "1985-03-12T00:00:00",
  email: "qa.test@atriis.com",
  phone: "046700900",
};

// ===== WHEN STEPS =====

When("I start recording the app traffic for API V1", async function () {
  this.apiV1 = ApiV1Flights.startRecording(this.page);
});

When("I select the first {string} flight from the recorded search for API V1", async function (carrierCode) {
  this.apiV1Selected = ApiV1Flights.selectRecordedPackage(this.apiV1, carrierCode);
});

When("I request the API V1 seat map for the selected flight before any trip exists", async function () {
  logger.info("Requesting the API V1 seat map with TripId 0", { flight: this.apiV1Selected.flight });
  this.apiV1SeatMap = await ApiV1Flights.getSeatMapWithoutTrip(this.apiV1, this.apiV1Selected);
});

When("I price the selected flight through API V1 creating a new trip", async function () {
  const trip = await ApiV1Flights.priceCreatingTrip(this.apiV1, this.apiV1Selected);
  this.apiV1Trip = trip;
  // The payload steps and the cancel step work on the scenario trip — point them at the V1 trip.
  this.tripId = trip.tripId;
  this.currentTripId = trip.tripId;
  this.recordTripId(trip.tripId);
  logger.info("API V1 trip created", trip);
});

When("I hold the API V1 trip with the selected paid seat for the first passenger", async function () {
  const { pnr } = await ApiV1Flights.holdWithSeat(this.apiV1, this.apiV1Selected, this.apiV1Trip, this.apiV1Seat, API_V1_TEST_TRAVELER);
  this.apiV1Pnr = pnr;
  logger.info("API V1 hold returned a PNR", { tripId: this.apiV1Trip.tripId, pnr });
});

When("I open the API V1 trip in the app", async function () {
  await ApiV1Flights.openTripCart(this.page, this.apiV1Trip.tripId);
});

// ===== THEN STEPS =====

Then("the API V1 seat map should offer an available paid seat", async function () {
  this.apiV1Seat = ApiV1Flights.findFirstPaidAvailableSeat(this.apiV1SeatMap);
  // Exposed for "{apiV1SeatLocation}" placeholders in the payload steps.
  this.apiV1SeatLocation = `${this.apiV1Seat.rowNumber}${this.apiV1Seat.seatNumber}`;
  logger.info("Paid seat selected from the API V1 seat map", this.apiV1Seat);
  expect(this.apiV1Seat.price, "Selected seat should carry a price").toBeGreaterThan(0);
});

Then("the API V1 hold should return a PNR", async function () {
  expect(this.apiV1Pnr, "API V1 hold should return a PNR").toBeTruthy();
});
