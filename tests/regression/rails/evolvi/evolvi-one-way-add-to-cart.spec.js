/**
 * Evolvi One Way Add to Cart Test
 * 
 * This test validates the complete flow of searching for and adding an Evolvi one-way train
 * ticket to the cart. It covers login, traveler setup, search functionality, and cart validation.
 * 
 * Test Flow:
 * 1. Login with Evolvi user and book new trip
 * 2. Add logged-in user as the traveler
 * 3. Search for one-way Evolvi train from LIC to 105
 * 4. Add first available train option to cart
 * 5. Verify quote status is "Pending booking"
 */

const { test, expect, evolviUserOneTest } = require('../../../fixtures/testWithFixtures');

// DSL imports
const Search = require('../../../../src/dsl/Search');
const EvolviSearch = require('../../../../src/dsl/EvolviSearch');
const EvolviResults = require('../../../../src/dsl/EvolviResults');
const Cart = require('../../../../src/dsl/Cart');

test.describe('[@regression] Evolvi One Way Add to Cart Flow', () => {
  evolviUserOneTest('[@priority:critical] Search and Add Evolvi One Way Train to Cart – Should complete full add to cart flow', async ({ newTripPageEVOLVI_USER_ONE }) => {
    // Step 1: Initialize test with logged-in user and new trip page
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPageEVOLVI_USER_ONE;

    // Step 2: Configure traveler - set logged-in user as the traveler
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Execute Evolvi one-way search for LIC to 105 route
    console.log('Step 3: Search one-way Evolvi train LIC → 105');
    await EvolviSearch.searchEvolviOneWay(page, 'licTo105');

    // Step 4: Select and add first available train option to cart
    console.log('Step 4: Add first train option to cart');
    await EvolviResults.addEvolviToTrip(page);
    
    // Step 5: Validate booking status - should be "Pending booking"
    console.log('Step 5: Quote is "Pending booking" status');
    expect(await Cart.isQuotePendingBooking(page)).toBe(true);

    console.log('Evolvi one way train add to cart flow completed successfully.');
  });
});