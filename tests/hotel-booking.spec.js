// tests/hotel-booking.spec.js
const { test, expect } = require('../fixtures/testWithFixtures');

// DSL imports
const App = require('../dsl/App');
const Search = require('../dsl/Search');
const HotelSearch = require('../dsl/HotelSearch');
const HotelResults = require('../dsl/HotelLevelResults');
const RoomLevelResults = require('../dsl/RoomLevelResults');

// Test data imports
const config = require('../test-data/config');

test.describe('Hotel Booking End-to-End Flow', () => {
  test('should complete full hotel booking flow', async ({ newTripPage }) => {
    // Step 1: Login with Amadeus user one
    console.log('Step 1 & 2: Login + Book a New Trip handled by fixtures');
    const page = newTripPage;

    // Step 3: Add traveler - I'm the traveler
    console.log('Step 3: Add traveler - I am the traveler');
    await Search.addTravelerImTheTraveller(page);
    
    // Step 4: Search a hotel in London, UK for 1 night (using tripPage)
    console.log('Step 4: Search hotel in London, UK for 1 night');
    await HotelSearch.searchHotelOneNight(page, { where: 'London, UK' });

    // Step 5: Navigate to hotel level and add a refundable hotel to cart
    console.log('Step 5: Select first hotel option');
    await HotelResults.clickFirstHotelOption(page);
    
    console.log('Step 6: Add refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(page);

    // Step 7: Assert Pending booking (assertion in spec, not DSL)
    console.log('Step 7: Assert Pending booking');
    await expect(page.getByText('Pending booking')).toBeVisible();
    
    // Step 8: Assert refundable hotel appears in cart
    console.log('Step 8: Assert refundable hotel in cart');
    await expect(page.locator('div.cancellation-terms.refundable:has-text("Refundable")')).toBeVisible();

    console.log('Hotel flow completed successfully!');
  });
});