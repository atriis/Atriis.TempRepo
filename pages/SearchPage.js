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
  addGuestModalButton: ".app-footer .add-guest-btn"
};

class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // Clicks the traveler icon to open traveler options
  async clickTravelerIcon() {
    await this.page.click(SELECTORS.travelerIcon);
  }

  // Clicks the "I am the traveler" button to confirm traveler identity
  async clickImTheTraveler() {
    await this.page.click(SELECTORS.imTheTravelerButton);
  }

  // Waits for the star icon to appear, confirming page readiness
  async waitForStarIcon() {
    await this.page.waitForSelector(SELECTORS.starIcon, { state: "visible" });
  }

  // Executes search by clicking the search button
  async clickSearchButton() {
    await this.page.locator(SELECTORS.searchButton).click();
  }

  // Opens the guest information modal to add traveler details
  async clickGuestTypeModal() {
    await this.page.click(SELECTORS.guestTypeModalButton);
  }

  // Fills in the traveler's random first name in the guest information form
  async fillInRandomFirstName(firstName) {
    await this.page.fill(SELECTORS.firstNameInput, firstName);
  }

  // Fills in the traveler's random last name in the guest information form
  async fillInRandonLastName(lastName) {
    await this.page.fill(SELECTORS.lastNameInput, lastName);
  }

  // Selects "Male" from the gender dropdown in the guest information form
  async selectGenderMale() {
    await this.page.locator(SELECTORS.genderDropdown).click();
    await this.page.getByRole('option', { name: 'Male' }).first().click();
  }

  // Fills in the traveler's random date of birth in DD/MM/YYYY format
  async fillInRandomDateOfBirth(dateOfBirth) {
    await this.page.fill(SELECTORS.dateOfBirthInput, dateOfBirth);
  }

  // Fills in the traveler's random email address for booking confirmation
  async fillInRandomEmail(email) {
    await this.page.fill(SELECTORS.emailInput, email);
  }

  // Fills in the traveler's random phone number for contact purposes
  async fillInRandomPhone(phoneNumber) {
    await this.page.fill(SELECTORS.phoneInput, phoneNumber);
  }

  // Clicks the "Add Guest" button to confirm guest information entry
  async clickToAddGuestModal() {
    await this.page.click(SELECTORS.addGuestModalButton);
  }
}

module.exports = SearchPage;