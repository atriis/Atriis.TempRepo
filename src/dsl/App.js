const LoginPage = require('../pages/LoginPage');
const LogoutPage = require('../pages/LogoutPage');
const MenuPage = require('../pages/MenuPage');

const App = {
  // Performs complete user authentication workflow
  // Handles login form submission and waits for successful authentication confirmation
  async loginAs(page, { email, password }) {
    console.log(`Starting login process for user: ${email}`);
    const loginPage = new LoginPage(page);
    const menuPage = new MenuPage(page);

    await loginPage.waitForLoginPage();
    await loginPage.fillEmail(email);
    await loginPage.fillPassword(password);
    await loginPage.clickLoginButton();
    await menuPage.waitForLogoutIcon();

    console.log('Login completed');
  },

  // Opens a new trip booking page in a separate tab
  // Handles new page creation and waits for proper loading before returning
  async bookANewTrip(page) {
    console.log('Opening new trip booking page...');
    const menuPage = new MenuPage(page);

    await menuPage.waitForBookANewTripIcon();

    const [newTripPage] = await Promise.all([
      page.context().waitForEvent('page'),
      menuPage.clickBookANewTrip(),
    ]);

    await newTripPage.waitForLoadState();

    console.log('New trip tab opened');
    return newTripPage;
  },

  // Logs out the current user and waits for login page to load
  // Handles complete logout workflow and confirms redirect to login page
  async logout(page) {
    console.log('Starting logout process...');
    const menuPage = new MenuPage(page);
    const loginPage = new LoginPage(page);
    const logoutPage = new LogoutPage(page);

    await menuPage.waitForLogoutIcon();
    await menuPage.clickLogout();
    await logoutPage.waitForLogoutSuccessMessage();
    await loginPage.waitForgotPasswordText();

    console.log('User logout completed');
  },
};

module.exports = App;
