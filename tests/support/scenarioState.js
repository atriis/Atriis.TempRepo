function getTravelerCount(world) {
  // Prefer the UI-reported total — it is updated after every "add traveler" step and
  // already accounts for all travelers (self + guests), making it the ground-truth count.
  if (Number.isInteger(world.selectedTravelerCount) && world.selectedTravelerCount > 0) {
    return world.selectedTravelerCount;
  }

  // Fallback: use the explicitly tracked guest count when no UI count was captured.
  if (Number.isInteger(world.guestTravelerCount) && world.guestTravelerCount > 0) {
    return world.guestTravelerCount;
  }

  return 1;
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