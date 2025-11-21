const { waitForText } = require('../utils/wait');

// Centralized selectors for easy maintenance
const SELECTORS = {
  tripOverviewTitle: ".payments-title",
  flightDetailsButton: ".more-details-btn",
  tripActionsDropdownIcon: ".dropdowns-container .expand-icon",
  cancelTripOption: ".el-dropdown-menu__item span.mr-2",
  tripCancellationDialogTitle: "[aria-label='Trip cancellation'] .el-dialog__title",
  confirmCancelButton: "role=button[name='Cancel trip']",
  cancellationSuccessMessage: "text='Cancellation confirmed!'",
  bookingStatusLabel: ".app-label--quote"
};

class TripOverviewPage {
  constructor(page) {
    this.page = page;
  }

  // Waits for the "Trip overview" title to appear, confirming page load
  async waitForTripOverviewTitle() {
    await waitForText(this.page, SELECTORS.tripOverviewTitle, "Trip overview");
  }

  // Waits for the "Flight details" text to appear, indicating flight trip content is loaded
  async waitForFlightDetailsText() {
    await waitForText(this.page, SELECTORS.flightDetailsButton, "Flight details");
  }

  // Hovers over the trip actions dropdown (three dots menu) to reveal action options
  async hoverTripActionsDropdownIcon() {
    console.log('Hovering trip actions dropdown...');
    const icon = this.page.locator(SELECTORS.tripActionsDropdownIcon).first();
    await icon.waitFor({ state: 'visible', timeout: 5000 });
    await icon.hover();
    await this.page.waitForTimeout(500); // Allow dropdown animation
    console.log('Successfully hovered trip actions dropdown');
  }

  // Waits for the dropdown menu to become visible after hovering the actions icon
  // Specifically looks for the "Cancel trip" option to confirm menu is ready
  async waitForDropdownMenu() {
    console.log('Waiting for dropdown menu to appear...');
    await this.page.locator(SELECTORS.cancelTripOption, { hasText: 'Cancel trip' }).waitFor({ state: 'visible', timeout: 5000 });
    console.log('Dropdown with "Cancel trip" is visible');
  }

  // Clicks the "Cancel trip" option from the dropdown menu
  async clickCancelTripOption() {
    console.log('Clicking cancel trip option...');
    const cancelOption = this.page.locator(SELECTORS.cancelTripOption, { hasText: 'Cancel trip' });
    await cancelOption.waitFor({ state: 'visible', timeout: 5000 });
    await cancelOption.click();
    console.log('Successfully clicked "Cancel trip"');
  }

  // Waits for the trip cancellation confirmation dialog to appear
  async waitForTripCancellationDialogTitle() {
    console.log('Waiting for cancellation dialog...');
    await waitForText(this.page, SELECTORS.tripCancellationDialogTitle, 'Trip cancellation');
    console.log('Found cancellation dialog');
  }

  // Clicks the confirmation button in the trip cancellation dialog
  async clickConfirmTripCancellationButton() {
    console.log('Clicking confirm cancellation button...');
    const button = this.page.getByRole('button', { name: 'Cancel trip' });
    await button.waitFor({ state: 'visible', timeout: 5000 });
    await button.click();
    console.log('Successfully clicked "Cancel trip"');
  }

  // Waits for the success message confirming trip cancellation
  async waitForTripCancelledMessage() {
    console.log('Waiting for cancellation success message...');
    const successMessage = this.page.getByText('Cancellation confirmed!', { exact: true });
    await successMessage.waitFor({ state: 'visible', timeout: 20000 });
    console.log('Cancellation confirmed message found');
  }

  // Checks for booking status text indicating trip is finalizing
  // Focuses specifically on "Finalizing" status for precise booking state detection
  async waitForFinalizingText() {
    console.log('Checking for booking status...');
    const locator = this.page.locator(SELECTORS.bookingStatusLabel);
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      const text = (await locator.innerText()).trim();
      console.log(`Found status text: "${text}"`);
      return text.toLowerCase().includes('finalizing');
    } catch {
      console.log('Finalizing status not found');
      return false;
    }
  }
}

module.exports = TripOverviewPage;