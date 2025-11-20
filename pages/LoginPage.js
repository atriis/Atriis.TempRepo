// pages/LoginPage.js
const { waitForText } = require('../utils/wait');


class LoginPage {
  constructor(page) {
    this.page = page;
  }

  // Wait for login page fields to be visible
  async waitForLoginPage() {
    console.log('Waiting for Login page...');
    await this.page.waitForSelector('#email', { state: 'visible' });
    await this.page.waitForSelector('#psw', { state: 'visible' });
    console.log('Login page visible');
  }

  // Fill username
  async fillUsername() {
    console.log('Filling username');
    await this.page.fill('#email', 'ruimariano@amadeus.com');
  }

  // Fill password (hardcoded like shared step)
  async fillPassword() {
    console.log('Filling password');
    await this.page.fill('#psw', 'NextLevelAtriis25!');
  }

  // Click Login button
  async clickLoginButton() {
    console.log('Clicking login button');
    await this.page.click('#resetText');
  }

  // Wait for logout icon to confirm login
  async waitForLogoutIcon() {
    console.log('Waiting for logout icon...');
    await waitForText(this.page, '.logout-icon', 'logout');
    console.log('Logout icon visible — login successful');
  }
}

module.exports = LoginPage;
