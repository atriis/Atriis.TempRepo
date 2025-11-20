const { waitForText } = require('../utils/wait');
const { getText } = require('../utils/dom');

class CartPage {
  constructor(page) {
    this.page = page;
  }

   async handleConflictQuoteModalIfVisible() {
    console.log("Handle 'Conflicting Quotes' modal if it appears");

    // Try to detect any element that clearly belongs to the modal
    const proceedButton = this.page.locator('button:has-text("Proceed")').first();

    try {
      // Wait a bit for the modal to show up; if it doesn't, just return false
      await proceedButton.waitFor({ state: 'visible', timeout: 8000 });
    } catch {
      console.log("No 'Proceed' button found – assuming no Conflicting Quotes modal");
      return false;
    }

    console.log("'Proceed' button visible, clicking it...");
    await proceedButton.click();

    // Optional: wait for modal to disappear
    await this.page.waitForTimeout(1000);

    // If the modal has a container, you can replace the timeout with:
    // await this.page.locator('text=Conflicting Quotes').first().waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});

    console.log("Conflicting Quotes modal handled");
    return true;
  }

  async acceptTermsAndConditions() {
    const checkbox = this.page.locator(".el-checkbox__inner").first();
  await checkbox.waitFor({ state: "visible" });

  await checkbox.click();
}

  async waitForProceedToCheckout() {
    const text = await getText(this.page, ".btn-container span");

    if (text === "'Proceed to Checkout'") {
      await waitForText(this.page, ".btn-container span", "Proceed to Checkout");
    }
  }

  async clickProceedToCheckout() {
    await this.page.click(".btn-container span");
  }

  async waitForPendingBookingText() {
    await waitForText(this.page, ".app-label", "Pending booking");
  }

async waitForHotelRefundableText() {
await this.page.locator('div.cancellation-terms.refundable:has-text("Refundable")').waitFor({ state: 'visible' });
}
}

module.exports = CartPage;
