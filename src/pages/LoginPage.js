// Centralized selectors for easy maintenance
const SELECTORS = {
  emailInput: '#email',
  passwordInput: '#psw',
  loginButton: '#resetText'
};

class LoginPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for login page fields to be visible
  // Confirms that the login form is ready for interaction
  async waitForLoginPage() {
    console.log('Waiting for Login page...');
    await this.page.waitForSelector(SELECTORS.emailInput, { state: 'visible' });
    await this.page.waitForSelector(SELECTORS.passwordInput, { state: 'visible' });
    console.log('Login page visible');
  }

  // Fills the email field with the provided email address
  async fillEmail(email) {
    console.log('Filling email');
    await this.page.fill(SELECTORS.emailInput, email);
  }

  // Fills the password field with the provided password
  async fillPassword(password) {
    console.log('Filling password');
    await this.page.fill(SELECTORS.passwordInput, password);
  }

  // Clicks the Login button to submit the login form
  async clickLoginButton() {
    console.log('Clicking login button');
    await this.page.click(SELECTORS.loginButton);
  }
}

module.exports = LoginPage;