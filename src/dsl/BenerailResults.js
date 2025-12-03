const BenerailResultsPage = require('../pages/BenerailResultsPage');

const BenerailResults = {
  /**
   * Waits for Benerail search results to load and verifies the Select button is available
   * Ensures the results page has fully loaded before attempting any interactions
   * Uses waitForSelectText method to confirm results are ready for selection
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Result object with status confirmation
   * 
   * Examples:
   *   await BenerailResults.waitForBenerailResults(page);
   * 
   * @throws {Error} - When Select button fails to appear within timeout
   */
  async waitForBenerailResults(page) {
    console.log('Waiting for Benerail search results to load...');
    const benerailResultsPage = new BenerailResultsPage(page);

    await benerailResultsPage.waitForSelectText();

    console.log('Benerail search results loaded successfully');
    return { loaded: true };
  },

  /**
   * Selects the first available Benerail option from search results
   * Handles clicking the first Select button in the results list
   * Adds the selected Benerail option to the current trip booking
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Selection result object with status confirmation
   * 
   * Examples:
   *   await BenerailResults.selectFirstBenerailOption(page);
   * 
   * @throws {Error} - When Select button is not clickable or interaction fails
   */
  async selectFirstBenerailOption(page) {
    console.log('Selecting first Benerail option from results...');
    const benerailResultsPage = new BenerailResultsPage(page);

    await benerailResultsPage.clickSelectFirstBenerailOption();

    console.log('First Benerail option selected successfully');
    return { selected: true };
  },

  /**
   * Performs complete Benerail selection workflow from search results
   * Combines waiting for results and selecting first option in a single method
   * Provides end-to-end functionality for Benerail result handling
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Workflow result object with status and selection confirmation
   * 
   * Examples:
   *   await BenerailResults.waitAndSelectFirstBenerail(page);
   * 
   * @throws {Error} - When either waiting or selection step fails
   */
  async waitAndSelectFirstBenerailOption(page) {
    console.log('Starting Benerail results workflow: wait and select...');
    const benerailResultsPage = new BenerailResultsPage(page);

    // Wait for results to load
    await benerailResultsPage.waitForSelectText();
    console.log('Results loaded, proceeding with selection...');

    // Select first option
    await benerailResultsPage.clickSelectFirstBenerailOption();

    console.log('Benerail option was selected successfully');
    return { workflowCompleted: true, selected: true };
  },
  
  /**
   * Waits for Benerail results and clicks the 'Add to Trip' button
   * Handles the workflow of waiting for results to load and then adding to trip
   * Confirms the Add to Trip button is available before attempting interaction
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Workflow result object with status confirmation
   * 
   * Examples:
   *   await BenerailResults.clickAddToTripBenerail(page);
   * 
   * @throws {Error} - When Add to Trip button is not available or interaction fails
   */
  async clickAddToTripBenerail(page) {
    console.log('Starting Benerail results workflow: wait and add to trip...');
    const benerailResultsPage = new BenerailResultsPage(page);

    // Wait for results to load
    await benerailResultsPage.waitForAddToTripText();
    console.log('Results loaded, proceeding with adding to trip...');

    // Select first option
    await benerailResultsPage.clickAddToTripButton();
    console.log('Benerail result added to trip successfully');
    return { workflowCompleted: true, selected: true };
  },

  /**
   * Complete workflow to add a Benerail option to the current trip
   * Performs selection of first Benerail option and then adds it to trip
   * Combines both selection and add-to-trip actions in a single method
   * 
   * @param {Object} page - Playwright page instance
   * @returns {Object} - Result object confirming the option was added to trip
   * 
   * Examples:
   *   await BenerailResults.addBenerailToTrip(page);
   * 
   * @throws {Error} - When selection or add-to-trip step fails
   */
  async addBenerailToTrip(page) {
    console.log('Adding Benerail to trip...');
    const benerailResultsPage = new BenerailResultsPage(page);
    await BenerailResults.waitAndSelectFirstBenerailOption(page);
    await benerailResultsPage.clickAddToTripButton();
    console.log('Benerail added to trip successfully');
    return { addedToTrip: true };
  }
};

module.exports = BenerailResults;