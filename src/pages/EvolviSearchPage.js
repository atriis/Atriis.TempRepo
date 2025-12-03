// ------------------------------------------------------------------------ CONTINUE FROM HERE ------------------------------------------------------------------------

// Centralized selectors for easy maintenance
const SELECTORS = {
  railTab: "#tab-rails",
  oneWayButton: ".uk-rail-search > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label",
  returnButton: ".uk-rail-search > :nth-child(1) [role='radiogroup'] > :nth-child(1) .el-radio__label",
  fromAndToStationLocationInput: "[placeholder='Enter station or location']",
  departureField: "[placeholder='Departure']",
  returnField: "[placeholder='Return']"
};

class EvolviSearchPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Clicks on the rail tab to switch to rail booking mode
   */
  async clickRailTab() { // _____________________________ NEED TO REMOVE DUPLICATE METHOD _____________________________
    console.log('Clicking rail tab...');
    await this.page.click(SELECTORS.railTab);
    console.log('Rail tab clicked successfully');
  }

  /**
   * Selects Evolvi search option from the rail dropdown
   * Clicks rail tab first, then selects 'UK Rail' option from the dropdown
   */
  async selectEvolviSearch() {
    console.log('Selecting Evolvi search...');
    await this.page.click(SELECTORS.railTab);
    await this.page.getByRole('option', { name: 'UK Rail' }).click();
    console.log('Evolvi search selected successfully');
  }

  /**
   * Selects the "One way" trip option for rail booking
   */
  async selectOneWayTrip() {
    console.log('Selecting one-way trip...');
    await this.page.click(SELECTORS.oneWayButton);
    console.log('One-way trip selected successfully');
  }

  /**
   * Selects the "Round trip" trip option for rail booking
   */
  async selectRoundTrip() {
    console.log('Selecting round trip...');
    await this.page.click(SELECTORS.returnButton);
    console.log('Round trip selected successfully');
  }

  /**
   * Fills the "From" station location field and tabs out to dismiss suggestions
   * Ensures proper focus handling and allows autocomplete dropdown to close
   * 
   * @param {string} from - Station location to fill in the From field
   */
  async fillFromStationLocation(from) {
    console.log(`Filling 'From' station location with: ${from}`);
    await this.page.type(SELECTORS.fromAndToStationLocationInput, from);
    await this.page.waitForTimeout(1000); // Ensure option is displayed
    await this.page.keyboard.press('Tab');
    console.log('From station location filled successfully');
  }

  /**
   * Fills the "To" station location field and tabs out to dismiss suggestions
   * Ensures proper focus handling and allows autocomplete dropdown to close
   * 
   * @param {string} to - Station location to fill in the To field
   */
  async fillToStationLocation(to) {
    console.log(`Filling 'To' station location with: ${to}`);
    await this.page.type(SELECTORS.fromAndToStationLocationInput, to);
    await this.page.waitForTimeout(1000); // Ensure option is displayed
    await this.page.keyboard.press('Tab');
    console.log('To station location filled successfully');
  }

  /**
   * Clicks the departure date field to open the date picker calendar
   */
  async clickDepartureField() {
    console.log('Clicking departure field...');
    await this.page.locator(SELECTORS.departureField).click();
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Departure field clicked successfully');
  }

  /**
   * Clicks the return date field to open the date picker calendar
   */
  async clickReturnField() {
    console.log('Clicking return field...');
    await this.page.locator(SELECTORS.returnField).click();
    await this.page.waitForTimeout(1500); // Extra wait for calendar stability
    console.log('Return field clicked successfully');
  } 
}

module.exports = EvolviSearchPage;
