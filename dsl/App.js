// dsl/App.js
const LoginPage = require('../pages/LoginPage');
const Menu = require('./Menu');

const App = {
  // High-level login action
  async loginAs(page, { email, password }) {
    const loginPage = new LoginPage(page);

    await loginPage.waitForLoginPage();
    await loginPage.fillEmail(email);
    await loginPage.fillPassword(password);
    await loginPage.clickLoginButton();
    await loginPage.waitForLogoutIcon();

    console.log('Login completed');
  },

  // Book a new trip action (delegates to Menu)
  async bookANewTrip(page) {
    return await Menu.bookANewTrip(page);
  },
};

module.exports = App;
