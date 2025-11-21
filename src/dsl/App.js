const LoginPage = require('../pages/LoginPage');
const MenuPage = require('../pages/MenuPage');

const App = {
  // Performs complete user authentication workflow
  // Handles login form submission and waits for successful authentication confirmation
  async loginAs(page, { email, password }) {
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
};

module.exports = App;
