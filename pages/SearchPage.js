class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // Click the traveler icon
  async clickTravelerIcon() {
    await this.page.click(".traveler-name");
  }

  // Click the "I am the traveler" button
  async clickImTheTraveler() {
    await this.page.click(".imt-btn");
  }

  // Waits for the star icon to appear
  async waitForStarIcon() {
    await this.page.waitForSelector(".star-icon", { state: "visible" });
  }

  // Executes search by clicking the search button
  async clickSearchButton() {
    await this.page.locator('button.search-btn').click();
  }

  // TODO: The following methods need to be fixed - Adding guest information flow 
  // Opens the guest information modal to add traveler details
  async clickGuestTypeModal() {
    await this.page.click(".add-guest-btn");
  }

  // Fills in the traveler's random first name in the guest information form
  async fillInRandomFirstName(firstName) {
    await this.page.fill("[placeholder='First Name']", firstName);
  }

  // Fills in the traveler's random last name in the guest information form
  async fillInRandonLastName(lastName) {
    await this.page.fill("[placeholder='Last Name']", lastName);
  }

  // Selects "Male" from the gender dropdown in the guest information form
  async selectGenderMale() {
    await this.page.locator('div.el-select__selected-item:has-text("Please select gender")').click();
    await this.page.getByRole('option', { name: 'Male' }).first().click();
  }

  // Fills in the traveler's random date of birth in DD/MM/YYYY format
  async fillInRandomDateOfBirth(dateOfBirth) {
    await this.page.fill("[placeholder='DD/MM/YYYY']", dateOfBirth);
  }

  // Fills in the traveler's random email address for booking confirmation
  async fillInRandomEmail(email) {
    await this.page.fill("[placeholder='Enter email address']", email);
  }

  // Fills in the traveler's random phone number for contact purposes
  async fillInRandomPhone(phoneNumber) {
    await this.page.fill("[placeholder='Enter phone number']", phoneNumber);
  }

  // Clicks the "Add Guest" button to confirm guest information entry
  async clickToAddGuestModal() {
    await this.page.click(".app-footer .add-guest-btn");
  }
}

module.exports = SearchPage;
