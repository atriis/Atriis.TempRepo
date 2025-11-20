// dsl/Cart.js

const CartPage = require('../pages/CartPage');

const Cart = {

   async clickProceedConflictQuoteModal(page) {
    const cartPage = new CartPage(page);
    const proceeded = await cartPage.handleConflictQuoteModalIfVisible();
    return { proceeded };
  },

  async acceptTermsAndConditionsAndProceedToCheckout(page) {
    const cartPage = new CartPage(page);

    await cartPage.acceptTermsAndConditions();
    await cartPage.clickProceedToCheckout();

    return { proceeded: true };
  },

};

module.exports = Cart;
