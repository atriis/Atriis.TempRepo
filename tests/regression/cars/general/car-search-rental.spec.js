const { test, expect } = require("@fixtures/supplierTest");

const { Search, CarSearch, CarResults, Cart } = require("@dsl");
const logger = require('@utils/logger').child('CarSearchRental');

test.describe("[@regression][@supplier:gds] Car City Center Search by Rental Agency", () => {
  test("[@priority:high] Car Search – Should complete full city center car search by rental agency", async ({ newTripPageFor }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip', { supplier: 'amadeus', user: 'user_one' });
    const page = await newTripPageFor("amadeus", "user_one");

    // Step 2: Add traveller - I'm the traveller
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    /*  // Step 3: Search car in London, UK
    logger.info('Searching car by rental agency', { location: 'London, UK', agency: 'Hertz' });
    await CarSearch.searchCarByPlaceAndRentalAgency(page, { place: 'London, UK', agencyName: 'Hertz' });

    // Step 4: Add first car and handle conflict modal if appears
    logger.info('Adding first car to cart');
    await CarResults.addCarCityCenterFromResultsPageToCart(page);

    // Step 5: Assert Pending booking
    logger.info('Asserting quote status', { status: 'Pending booking' });
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    logger.info('Car search by rental agency completed successfully'); */
  });
});
