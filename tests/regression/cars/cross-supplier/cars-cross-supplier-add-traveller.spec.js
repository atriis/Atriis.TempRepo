const { test } = require("@fixtures/supplierTest");

const { Search } = require("@dsl");
const logger = require('../../../src/utils/logger').child('CrossSupplierCars');

//This is a test just to verify the cross-supplier logic works, hence this test will run one time for each supplier
test.describe("[@regression][@supplier:all] Cross-supplier Cars Login and Add Traveller Flow", () => {
  test("[@priority:critical] Should login with each car supplier and add traveller", async ({ newTripPage }) => {
    // Step 1: Login
    logger.info('Login + Book a New Trip (fixtures)');
    const page = newTripPage;

    // Step 2: Add traveller - I'm the traveller
    logger.info('Adding me as traveler');
    await Search.addMeAsTraveler(page);

    logger.info('Cross-supplier flow completed successfully');
  });
});
