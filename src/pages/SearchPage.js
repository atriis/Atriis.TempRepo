// Centralized selectors for easy maintenance
const SELECTORS = {
  travelerIcon: ".traveler-name",
  imTheTravelerButton: ".imt-btn",
  starIcon: ".star-icon",
  searchButton: "button.search-btn",
  guestTypeModalButton: ".add-guest-btn",
  firstNameInput: "[placeholder='First Name']",
  lastNameInput: "[placeholder='Last Name']",
  genderDropdown: "div.el-select__selected-item:has-text('Please select gender')",
  genderOptionMale: "role=option[name='Male']",
  dateOfBirthInput: "[placeholder='DD/MM/YYYY']",
  emailInput: "[placeholder='Enter email address']",
  phoneInput: "[placeholder='Enter phone number']",
  addGuestModalButton: ".app-footer .add-guest-btn",
  datePickerPanel: ".el-picker-panel:visible",
  datePickerCalendarNextArrow: "button.el-picker-panel__icon-btn.arrow-right[aria-label='Next Month']:visible",
  datePickerMonthTable: "table.el-date-table",
  datePickerAvailableDayCell: "td.available .el-date-table-cell__text",
  travellerNameField: "[placeholder='Search by name, user group, username or email']",
  firstTravellerOption: "[id*='item-0']",
  addAnotherTravellerButton: ".add-btn .material-symbols-outlined"
};

class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks the traveler icon to open traveler options
  async clickTravelerIcon() {
    console.log('Clicking traveler icon...');
    await this.page.click(SELECTORS.travelerIcon);
    console.log('Traveler icon clicked successfully');
  }
  
  // Clicks the "Add Another Traveller" button to add more travelers
  async clickAnotherTravellerButton() {
    console.log('Clicking "Add Another Traveller" button...');
    await this.page.click(SELECTORS.addAnotherTravellerButton);
    console.log('"Add Another Traveller" button clicked successfully');
  }

  // Waits for "I am the traveler" button to load
  async waitForImTheTravelerButton() {
    console.log('Waiting for "I am the traveler" button to be visible...');
    await this.page.waitForSelector(SELECTORS.imTheTravelerButton, { state: "visible" });
    console.log('"I am the traveler" button is now visible');
  }

  // Clicks the "I am the traveler" button to confirm traveler identity
  async clickImTheTraveler() {
    console.log('Clicking "I am the traveler" button...');
    await this.page.click(SELECTORS.imTheTravelerButton);
    console.log('"I am the traveler" button clicked successfully');
  }

  // Waits for the star icon to appear, confirming page readiness
  async waitForStarIcon() {
    console.log('Waiting for star icon...');
    await this.page.waitForSelector(SELECTORS.starIcon, { state: "visible" });
    console.log('Star icon found successfully');
  }

  // Type in the traveller name
  async fillInTravellerName(name) {
    console.log(`Filling traveller name: ${name}`);
    await this.page.fill(SELECTORS.travellerNameField, name);
    console.log('Traveller name filled successfully');
  }

  // Select the first traveller from the autocomplete suggestions
  async selectFirstTravellerOption() {
    console.log('Selecting first traveller option...');
    await this.page.click(SELECTORS.firstTravellerOption);
    console.log('First traveller option selected successfully');
  }

  // Opens the guest information modal to add traveller details
  async clickGuestTypeModal() {
    console.log('Clicking guest type modal...');
    await this.page.click(SELECTORS.guestTypeModalButton);
    console.log('Guest type modal opened successfully');
  }

  // Fills in the traveller's random first name in the guest information form
  async fillInRandomFirstName(firstName) {
    console.log(`Filling first name: ${firstName}`);
    await this.page.fill(SELECTORS.firstNameInput, firstName);
    console.log('First name filled successfully');
  }

  // Fills in the traveller's random last name in the guest information form
  async fillInRandomLastName(lastName) {
    console.log(`Filling last name: ${lastName}`);
    await this.page.fill(SELECTORS.lastNameInput, lastName);
    console.log('Last name filled successfully');
  }

  // Selects "Male" from the gender dropdown in the guest information form
  async selectGenderMale() {
    console.log('Selecting gender Male...');
    await this.page.locator(SELECTORS.genderDropdown).click();
    await this.page.getByRole('option', { name: 'Male' }).first().click();
    console.log('Gender Male selected successfully');
  }

  // Fills in the traveler's random date of birth in DD/MM/YYYY format
  async fillInRandomDateOfBirth(dateOfBirth) {
    console.log(`Filling date of birth: ${dateOfBirth}`);
    await this.page.fill(SELECTORS.dateOfBirthInput, dateOfBirth);
    console.log('Date of birth filled successfully');
  }

  // Fills in the traveler's random email address for booking confirmation
  async fillInRandomEmail(email) {
    console.log(`Filling email: ${email}`);
    await this.page.fill(SELECTORS.emailInput, email);
    console.log('Email filled successfully');
  }

  // Fills in the traveler's random phone number for contact purposes
  async fillInRandomPhone(phoneNumber) {
    console.log(`Filling phone number: ${phoneNumber}`);
    await this.page.fill(SELECTORS.phoneInput, phoneNumber);
    console.log('Phone number filled successfully');
  }

  // Clicks the "Add Guest" button to confirm guest information entry
  async clickToAddGuestModal() {
    console.log('Clicking "Add Guest" button...');
    await this.page.click(SELECTORS.addGuestModalButton);
    console.log('"Add Guest" button clicked successfully');
  }

  // Navigates forward in the date calendar by clicking next month arrow
  // Default: advances 3 months
  async clickCalendarNextArrow(times = 3) {
    console.log('Clicking visible calendar next arrow', times, 'times...');
    const nextArrow = this.page.locator(SELECTORS.datePickerCalendarNextArrow);
    await nextArrow.waitFor({ state: 'visible' });
    for (let i = 0; i < times; i++) {
      await nextArrow.click();
      await this.page.waitForTimeout(300);
    }
    console.log('Clicked visible calendar next arrow', times, 'times');
  }

  // Executes search by clicking the search button
  async clickSearchButton() {
    console.log('Clicking search button...');
    await this.page.locator(SELECTORS.searchButton).click();
    console.log('Search button clicked successfully');
  }
}

module.exports = SearchPage;
module.exports.SELECTORS = SELECTORS;