require("module-alias/register");

const { When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const { TripApi } = require("@dsl");
const logger = require("@utils/logger").child("TripApi");

// ===== WHEN STEPS =====

When("I start recording the app session for the GetTrip API", async function () {
  this.tripApi = TripApi.startRecording(this.page);
});

When("I fetch the trip through the GetTrip API", async function () {
  this.getTripResponse = await TripApi.getTrip(this.tripApi, this.tripId);
});

// ===== THEN STEPS =====

Then("every GetTrip {string} flight should have flight class {string} and cabin class code {string}", async function (carrierCode, flightClass, cabinClassCode) {
  for (const flight of TripApi.getFlightsByCarrier(this.getTripResponse, carrierCode)) {
    logger.info("GetTrip flight classes", { flight: `${flight.Carrier}${flight.FlightNumber}`, flightClass: flight.FlightClass, cabinClassCode: flight.CabinClassCode });
    expect(flight.FlightClass, `${flight.Carrier}${flight.FlightNumber} FlightClass`).toBe(flightClass);
    expect(flight.CabinClassCode, `${flight.Carrier}${flight.FlightNumber} CabinClassCode`).toBe(cabinClassCode);
  }
});

// The supplier's booking class (RBD) is what search results show as the flight class, so GetTrip
// keeping the RBD means it matches the searched value for the same flight.
Then("every GetTrip {string} flight should keep the searched booking class and have cabin class code {string}", async function (carrierCode, cabinClassCode) {
  for (const flight of TripApi.getFlightsByCarrier(this.getTripResponse, carrierCode)) {
    const searched = this.tripApi.searchedFlightClasses.get(`${flight.Carrier}${flight.FlightNumber}`);
    logger.info("GetTrip flight classes", { flight: `${flight.Carrier}${flight.FlightNumber}`, searchedFlightClass: searched, flightClass: flight.FlightClass, cabinClassCode: flight.CabinClassCode });
    expect(searched, `${flight.Carrier}${flight.FlightNumber} was not in the recorded search results`).toBeTruthy();
    expect(flight.FlightClass, `${flight.Carrier}${flight.FlightNumber} FlightClass`).toBe(searched);
    expect(flight.CabinClassCode, `${flight.Carrier}${flight.FlightNumber} CabinClassCode`).toBe(cabinClassCode);
  }
});
