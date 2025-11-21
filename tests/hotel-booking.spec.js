const { test, expect } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../dsl/Search');
const HotelSearch = require('../dsl/HotelSearch');
const HotelResults = require('../dsl/HotelLevelResults');
const RoomLevelResults = require('../dsl/RoomLevelResults');
const Cart = require('../dsl/Cart');

test.describe('Hotel Booking End-to-End Flow', () => {
  test('should complete full hotel booking flow', async ({ newTripPage }) => {
    // Step 1: Login with Amadeus user one
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravelerImTheTraveller(page);

    // Step 3: Search a hotel in London, UK for 1 night (using tripPage)
    console.log('Step 3: Search hotel in London, UK for 1 night');
    await HotelSearch.searchHotelOneNight(page, { where: 'London, UK' });

    // Step 4: Navigate to hotel level and add a refundable hotel to cart
    console.log('Step 4: Select first hotel option');
    await HotelResults.clickFirstHotelOption(page);

    // Step 5: Add a refundable hotel to cart
    console.log('Step 5: Add refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

   // Step 6: Assert refundable hotel appears in cart
   console.log('Step 6: Assert refundable hotel in cart');
   expect(await Cart.isHotelRefundable(page)).toBe(true);

   console.log('Hotel flow completed successfully!');
  });
});