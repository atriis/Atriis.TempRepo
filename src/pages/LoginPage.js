
// Centralized selectors for easy maintenance
const SELECTORS = {
  EMAIL_INPUT: '#email',
  PASSWORD_INPUT: '#psw',
  LOGIN_BUTTON: '#resetText',
  FORGOT_PASSWORD_TEXT: '#forgotPsw'
};

class LoginPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for login page fields to be visible
  // Confirms that the login form is ready for interaction
  async waitForLoginPage() {
    console.log('Waiting for Login page...');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(SELECTORS.EMAIL_INPUT, { state: 'visible' });
    await this.page.waitForSelector(SELECTORS.PASSWORD_INPUT, { state: 'visible' });
    console.log('Login page visible');
  }

  // NEW: Waits for "Forgot password?" text to be visible
  async waitForgotPasswordText() {
    console.log('Waiting for "Forgot password?" text...');
    await this.page.waitForSelector(SELECTORS.FORGOT_PASSWORD_TEXT, { state: 'visible' });
    console.log('"Forgot password?" text is visible');
  }

  // Fills the email field with the provided email address
  async fillEmail(email) {
    console.log('Filling email');
    await this.page.fill(SELECTORS.EMAIL_INPUT, email);
  }

  // Fills the password field with the provided password
  async fillPassword(password) {
    console.log('Filling password');
    await this.page.fill(SELECTORS.PASSWORD_INPUT, password);
  }

  // Clicks the Login button to submit the login form
  async clickLoginButton() {
    console.log('Clicking login button');
    await this.page.click(SELECTORS.LOGIN_BUTTON);
  }
}

module.exports = LoginPage;
