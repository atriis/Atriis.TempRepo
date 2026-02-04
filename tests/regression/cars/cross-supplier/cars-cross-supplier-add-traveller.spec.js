const { test } = require('@fixtures/supplierTest');

const { Search } = require('@dsl');

//This is a test just to verify the cross-supplier logic works, hence this test will run one time for each supplier
test.describe('[@regression][@supplier:all] Cross-supplier Cars Login and Add Traveller Flow', () => {
  test('[@priority:critical] Should login with each car supplier and add traveller', async ({ newTripPage }) => {
    // Step 1: Login
    console.log('Step 1: Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    console.log('Step 2: Add traveller - I am the traveller');
    await Search.addMeAsTraveler(page);

    console.log('Cross-supplier flow completed successfully.');
  });
});