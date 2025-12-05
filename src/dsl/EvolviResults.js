const EvolviResultsPage = require('../pages/EvolviResultsPage');

const EvolviResults = {
  /**
   * Selects the cheapest suggested fare option and adds it to trip
   * Waits for suggested fares to load, clicks cheapest option, then adds to trip
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Selection result object with status confirmation
   */
  async selectCheapestSuggestedFare(page) {
    console.log('Adding Evolvi option from results...');
    const evolviResultsPage = new EvolviResultsPage(page);
    await evolviResultsPage.waitForSuggestedFaresText();
    await evolviResultsPage.clickCheapestSuggestedFareOption();
    await evolviResultsPage.waitForAddToTripButton();
    await evolviResultsPage.clickAddToTripButton();

    console.log('Evolvi cheapest suggested fare option added to trip successfully');
    return { selected: true };
  },
  /**
   * Selects and clicks the Add to Trip button for Evolvi fare options
   * Waits for Add to Trip button to be available then clicks it
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Selection result object with status confirmation
   */
  async selectAddToTripButton(page) {
    console.log('Selecting Add to trip option from results...');
    const evolviResultsPage = new EvolviResultsPage(page);
    await evolviResultsPage.waitForAddToTripButton();
    await evolviResultsPage.clickAddToTripButton();

    console.log('Evolvi fare option added to trip successfully');
    return { selected: true };
  },

  /**
   * Waits for Evolvi results and clicks the 'Add to Trip' button
   * Handles the workflow of waiting for results to load and then adding to trip
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Workflow result object with status confirmation
   */
  async clickAddToTripEvolvi(page) {
    console.log('Starting Evolvi results workflow: wait and add to trip...');
    const evolviResultsPage = new EvolviResultsPage(page);

    // Wait for results to load
    await evolviResultsPage.waitForAddToTripButton();
    console.log('Results loaded, proceeding with adding to trip...');

    // Add to trip
    await evolviResultsPage.clickAddToTripButton();
    console.log('Evolvi result added to trip successfully');
    return { workflowCompleted: true, selected: true };
  },

  /**
   * Complete workflow to add an Evolvi one-way option to the current trip
   * Waits for results to load, selects cheapest fare, and adds to trip
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Workflow result object with status and selection confirmation
   */
  async addEvolviToTrip(page) {
    console.log('Start adding Evolvi one-way from results page...');
    const evolviResultsPage = new EvolviResultsPage(page);

    // Wait for results to load
    await evolviResultsPage.waitForOutboundText();
    console.log('Results loaded, proceeding with selection...');
    await EvolviResults.selectCheapestSuggestedFare(page);
    await EvolviResults.clickAddToTripEvolvi(page);

    console.log('Evolvi option was selected and added to trip successfully');
    return { workflowCompleted: true, selected: true };
  },
  
  /**
   * Complete workflow to add an Evolvi roundtrip option to the current trip
   * Selects first route, then selects second route for complete journey
   * Handles the two-step selection process required for Evolvi roundtrip bookings
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Result object confirming the roundtrip option was added to trip
   */
  async addEvolviRoundtripToTrip(page) {
    console.log('Adding Evolvi roundtrip to trip from results page...');
    const evolviResultsPage = new EvolviResultsPage(page);

    // Wait for results to load
    await evolviResultsPage.waitForOutboundText();
    console.log('Results loaded, proceeding with selection...');
    await EvolviResults.selectCheapestSuggestedFare(page);
    console.log('First route selected successfully');
    
    // Wait for page to update and show second route options
    await page.waitForTimeout(500); // Extra wait to ensure stability
    console.log('Waiting for second route options...');
    
    // Second selection - select second route
    console.log('Selecting second route...');
    await evolviResultsPage.waitForSelectText();
    await evolviResultsPage.clickSelectFirstEvolviOption();
    console.log('Second route selected successfully');

    await EvolviResults.clickAddToTripEvolvi(page);

    console.log('Evolvi round trip added to trip successfully');
    return { addedToTrip: true };
  },
};

module.exports = EvolviResults;