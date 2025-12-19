const { test, expect } = require('../../../../fixtures/supplierTest');

const Search = require('../../../../../src/dsl/Search');
const FlightSearch = require('../../../../../src/dsl/FlightSearch');
const FlightResults = require('../../../../../src/dsl/FlightResults');
const FlightPricing = require('../../../../../src/dsl/FlightPricing');
const Cart = require('../../../../../src/dsl/Cart');

test.describe('[@regression] Add Flight By Schedule to Cart Flow', () => {
  test('[@priority:critical] Add Flight By Schedule to Cart – Should complete full add to cart flow', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search by scheduled PAR → LON flight
    console.log('Step 3: Search by scheduled flight PAR → LON');
    await FlightSearch.searchFlightBySchedule(page, {
      from: 'PAR',
      to: 'LON',
    });

    // Step 4: Select flight segments by schedule
    console.log('Step 4: Select flight segments by schedule');
    await FlightResults.selectSegmentsBySchedule(page);

    // Step 5: Add the selected flight to cart
    console.log('Step 5: Add selected flight to cart');
    await FlightPricing.addYourSelectionFareToCart(page);

    // Step 6: Assert Pending booking
    console.log('Step 6: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Flight by schedule add to cart flow completed successfully.');
  });
});
