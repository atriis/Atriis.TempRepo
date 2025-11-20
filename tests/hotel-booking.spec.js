// tests/hotel-booking.spec.js
const { test, expect } = require('@playwright/test');

// DSL imports
const App = require('../dsl/App');
const Search = require('../dsl/Search');
const HotelSearch = require('../dsl/HotelSearch');
const HotelResults = require('../dsl/HotelLevelResults');
const RoomLevelResults = require('../dsl/RoomLevelResults');
const Cart = require('../dsl/Cart');

// Test data imports
const config = require('../test-data/config.json');
const users = require('../test-data/users.json');

test.describe('Hotel Booking End-to-End Flow', () => {
  test('should complete full hotel booking flow', async ({ page }) => {
    // Step 1: Login with Amadeus user one
    console.log('Step 1: Login');
    await page.goto(config.stagingURL);
    await App.loginAs(page, users.amadeus.userOne);

    // Step 2: Book a new trip (opens new tab and returns tripPage)
    console.log('Step 2: Book a new trip');
    const tripPage = await App.bookANewTrip(page);

    // Step 3: Add traveler - I'm the traveler
    console.log('Step 3: Add traveler - I am the traveler');
    await Search.addTravelerImTheTraveller(tripPage);

    // Step 4: Search a hotel in London, UK for 1 night (using tripPage)
    console.log('Step 4: Search hotel in London, UK for 1 night');
    await HotelSearch.searchHotelOneNight(tripPage, { where: 'London, UK' });

    // Step 5: Navigate to hotel level and add a refundable hotel to cart
    console.log('Step 5: Select first hotel option');
    await HotelResults.clickFirstHotelOption(tripPage);

    console.log('Step 6: Add refundable hotel to cart');
    await RoomLevelResults.addRefundableHotelRoomLevelToCart(tripPage);

    // Step 7: Assert Pending booking (assertion in spec, not DSL)
    console.log('Step 7: Assert Pending booking');
    await expect(tripPage.getByText('Pending booking')).toBeVisible();

    // Step 8: Assert refundable hotel appears in cart
    console.log('Step 8: Assert refundable hotel in cart');
    await expect(tripPage.locator('div.cancellation-terms.refundable:has-text("Refundable")')).toBeVisible();

    console.log('Hotel flow completed successfully!');
  });
});