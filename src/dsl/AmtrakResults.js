const Results = require("./Results");

/**
 * AmtrakResults DSL
 *
 * Business actions performed on the Amtrak results list.
 */
const AmtrakResults = {
  /**
   * Adds the first Amtrak one-way result to the trip.
   *
   * The Amtrak results list renders "Select" on every result card and only reveals "Add to trip"
   * once a result is selected, so the plain "add the first result" flow
   * (Results.waitAndClickAddToTripButton) waits for a button that is not on screen yet. This drives
   * the two-click sequence the page actually requires.
   * @param {import('playwright').Page} page
   * @returns {Promise<{addedToTrip: boolean}>}
   */
  async addAmtrakOneWayToTrip(page) {
    if (!page) throw new Error("page is required");

    await Results.clickSelectButtonOneWayAndClickAddToTrip(page);
    return { addedToTrip: true };
  },
};

module.exports = AmtrakResults;
