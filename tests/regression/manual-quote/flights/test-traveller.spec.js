const { test } = require('@fixtures/supplierTest');
const { Search } = require('@dsl');

test.describe('Manual Quote - Add Flight Manual Quote to Cart', () => {
  test('[@priority:critical] Should complete add flight manual quote to cart flow', async ({ newTripPageFor }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = await newTripPageFor('travelpolicy', 'user_one');

    // Step 2: Add traveller - I am the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

    // Step 3: Add second traveller by name
    console.log('Step 3: Add second traveller by name');
    await Search.addSecondTravellerByName(page, 'Poly Mispar');
    
    //Step 4: Add third traveller by name
    console.log('Step 4: Add third traveller by name');
    await Search.addThirdTravellerByName(page, 'Amber Ofpas');
  });
});
