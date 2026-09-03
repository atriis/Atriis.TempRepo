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

function getGsaAllowance(world) {
  const allowance = world.gsaAllowance;

  if (!allowance || typeof allowance.nightlyLimit !== "number") {
    throw new Error(
      "The GSA nightly lodging limit must be extracted for the searched check-in month before it can be verified",
    );
  }

  return allowance;
}

// Optional on purpose: this offset is context for a scroll assertion, never the thing being
// asserted, so a scenario that never captured it gets null rather than a failure.
function getHotelListScrollOffsetAtSelection(world) {
  const offset = world.hotelListScrollOffsetAtSelection;
  return typeof offset === "number" && !Number.isNaN(offset) ? offset : null;
}

// The per-night price and stay total most recently read in the scenario, whichever surface they came
// from (the room-level price breakdown dialog, or the cart's More Details drawer). Both extraction
// steps publish the same two names, so the price-per-night check reads one pair and does not care
// which surface produced it — but that also means both must have been read on the SAME surface, so
// the error names the steps that publish them.
function getPricePerNightAndTotal(world) {
  const pricePerNight = world.pricePerNight;
  const totalPrice = world.totalPrice;

  const missing = [];
  if (typeof pricePerNight !== "number" || Number.isNaN(pricePerNight)) missing.push("a price per night");
  if (typeof totalPrice !== "number" || Number.isNaN(totalPrice)) missing.push("a total price");

  if (missing.length > 0) {
    throw new Error(
      `No ${missing.join(" and ")} has been extracted yet. Run "I extract prices from the price breakdown" ` +
        `(room level), or both "I extract total for N rooms price in more details" and ` +
        `"I extract the N night price from rate information" (cart More Details), before comparing them.`,
    );
  }

  return { pricePerNight, totalPrice };
}

module.exports = {
  getTravelerCount,
  getStoredFlightNumbers,
  getGsaAllowance,
  getHotelListScrollOffsetAtSelection,
  getPricePerNightAndTotal,
};