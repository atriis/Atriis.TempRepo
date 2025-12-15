const { test, expect, ratehawkUserOneTest } = require('../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../src/dsl/Search');
const HotelSearch = require('../../src/dsl/HotelSearch');
const HotelLevelResults = require('../../src/dsl/HotelLevelResults');
const RoomLevelResults = require('../../src/dsl/RoomLevelResults');
const Cart = require('../../src/dsl/Cart');

test.describe('[@regression] Hotel Add To Cart Multiple Nights', () => {
  ratehawkUserOneTest('[@priority:critical] Hotel Add To Cart – Should complete full hotel add to cart flow for multiple nights', async ({ newTripPageRATEHAWK_USER_ONE }) => {
    // Step 1: Login with Amadeus user one
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageRATEHAWK_USER_ONE;

    // Step 2: Add traveler - I'm the traveler
    console.log('Step 2: Add traveler - I am the traveler');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Search a hotel in London, UK for 3 nights
    console.log('Step 3: Search hotel in London, UK for 3 nights');
    await HotelSearch.searchHotelByNights(page, { where: 'London, UK', nights: 3 });
    
    // Step 4: Navigate to hotel level and add a refundable hotel to cart
    console.log('Step 4: Select first hotel option');
    await HotelLevelResults.clickFirstHotelOption(page);

    // Step 5: Add a refundable hotel to cart
    console.log('Step 5: Add refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 6: Assert refundable hotel appears in cart before booking
    console.log('Step 6: Assert refundable hotel in cart');
    expect(await Cart.isHotelRefundable(page)).toBe(true);

    console.log('Hotel add to cart flow for multiple nights completed successfully.');
  });
});