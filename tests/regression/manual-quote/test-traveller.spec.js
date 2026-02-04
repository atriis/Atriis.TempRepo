const { test } = require('@fixtures/supplierTest');
const { Search } = require('@dsl');

test.describe('Manual Quote - Add Flight Manual Quote to Cart', () => {
  test('[@priority:critical] Should complete add flight manual quote to cart flow', async ({ newTripPageFor }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = await newTripPageFor('travelpolicy', 'user_one');

    // Step 2: Add me as traveler
    console.log('Step 2: Add me as traveler');
    await Search.addMeAsTraveler(page);

    // Step 3: Add second traveler by name
    console.log('Step 3: Add second traveler by name');
    await Search.addTravelerByName(page, 'Poly Mispar');
    
    //Step 4: Add third traveler by name
    console.log('Step 4: Add third traveler by name');
    await Search.addTravelerByName(page, 'Amber Ofpas');
  });
});
