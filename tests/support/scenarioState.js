function getTravelerCount(world) {
  if (Number.isInteger(world.selectedTravelerCount) && world.selectedTravelerCount > 0) {
    return world.selectedTravelerCount;
  }

  return (world.guestTravelerCount ?? 0) + 1;
}

function getStoredFlightNumbers(world) {
  const storedFlightNumbers = Array.isArray(world.storedFlightNumbers)
    ? world.storedFlightNumbers.filter((flightNumber) => typeof flightNumber === "string" && flightNumber.trim())
    : [];

  if (storedFlightNumbers.length > 0) {
    return storedFlightNumbers;
  }

  if (typeof world.storedFlightNumber === "string" && world.storedFlightNumber.trim()) {
    return [world.storedFlightNumber];
  }

  throw new Error("A stored flight number must be available before validating the flight capacity modal");
}

module.exports = {
  getTravelerCount,
  getStoredFlightNumbers,
};