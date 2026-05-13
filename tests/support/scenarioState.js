function getTravelerCount(world) {
  const uiCount = Number.isInteger(world.selectedTravelerCount) ? world.selectedTravelerCount : 0;
  const guestCount = Number.isInteger(world.guestTravelerCount) ? world.guestTravelerCount : 0;

  // The UI-reported count is the ground truth (self + guests), but it is read immediately
  // after clicking "Add Guest" and may be stale if the tag hasn't rendered yet in CI.
  // When the UI count is lower than the tracked guest count, it is stale — use guest count.
  if (uiCount >= guestCount && uiCount > 0) {
    return uiCount;
  }

  if (guestCount > 0) {
    return guestCount;
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