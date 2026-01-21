const { test } = require('@fixtures/supplierTest');

const { Search } = require('@dsl');

test.describe('[@regression][@supplier:sunny] SUNNY SPECIFIC', () => {
  test('[@priority:critical] Sunny Specific Test', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addTravellerImTheTraveller(page);

  });
});