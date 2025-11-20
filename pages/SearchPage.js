class SearchPage {
  constructor(page) {
    this.page = page;
  }

  // "I am the traveler" flow
  async clickTravelerIcon() {
    await this.page.click(".traveler-name");
  }

  async clickImTheTraveler() {
    await this.page.click(".imt-btn");
  }

  async clickGuestTypeModal() {
  await this.page.click(".add-guest-btn");
  }

  async fillInRandomFirstName(firstName) {
    await this.page.fill("[placeholder='First Name']", firstName);
  }

  async fillInRandonLastName(lastName) {
    // keeping your exact name: fillInRandonLastName
    await this.page.fill("[placeholder='Last Name']", lastName);
  }

  async selectGenderMale() {
   await this.page.locator('div.el-select__selected-item:has-text("Please select gender")').click();
   await this.page.getByRole('option', { name: 'Male' }).first().click();
  }

  async fillInRandomDateOfBirth(dateOfBirth) {
    await this.page.fill("[placeholder='DD/MM/YYYY']", dateOfBirth);
  }

  async fillInRandomEmail(email) {
    await this.page.fill("[placeholder='Enter email address']", email);
  }

  async fillInRandomPhone(phoneNumber) {
    await this.page.fill("[placeholder='Enter phone number']", phoneNumber);
  }

/*   async selectPhoneTypeCellular() {
    // Open phone type dropdown
    await this.page.click(".contact-info-container .el-select__caret");
    // Select the "Cellular" option (keeping your original selector)
    await this.page.click("#el-id-5134-938 > span");
  } */

   async clickToAddGuestModal() {
    await this.page.click(".app-footer .add-guest-btn");
  }

  async waitForStarIcon() {
    await this.page.waitForSelector(".star-icon", { state: "visible" });
  }

  async clickSearchButton() {
  await this.page.locator('button.search-btn').click();
}
}

module.exports = SearchPage;
