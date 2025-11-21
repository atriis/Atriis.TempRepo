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

  // Fill email
  async fillEmail(email) {
    console.log('Filling email');
    await this.page.fill('#email', email);
  }

  // Fill password
  async fillPassword(password) {
    console.log('Filling password');
    await this.page.fill('#psw', password);
  }

  // Click Login button
  async clickLoginButton() {
    console.log('Clicking login button');
    await this.page.click('#resetText');
  }
}

module.exports = LoginPage;
