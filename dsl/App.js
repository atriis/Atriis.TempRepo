// dsl/App.js
const LoginPage = require('../pages/LoginPage');
const Menu = require('./Menu');

const App = {
  // High-level login action
  async loginAs(page, username) {
    const loginPage = new LoginPage(page);

    await loginPage.waitForLoginPage();
    await loginPage.fillUsername(username);
    await loginPage.fillPassword();
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
