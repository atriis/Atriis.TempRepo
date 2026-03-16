const { waitForText } = require("@utils/wait");
const { pressTab } = require("@utils/dom");

/**
 * Page Object for hotel search page.
 * Contains only UI-level interactions.
 */

const SELECTORS = {
  HOTEL_TAB: "#tab-hotel",
  HOTEL_HEADING: "#pane-hotel > h4",
  HOTEL_DESTINATION_FIELD: "[placeholder='Where would you like to stay?']",
  AUTOCOMPLETE_FIRST_OPTION: ".el-autocomplete-suggestion__list li[id*='item-0']",
  AUTOCOMPLETE_LIST: ".el-autocomplete-suggestion__list",
  CHECK_IN_INPUT: "[placeholder='Check in']",
  ROOMS_DROPDOWN: '.hotel-search-cmp .app-select:has(.select-icon:text("sensor_door"))',
  ROOMS_DROPDOWN_OPTION: '.app-select-popper .el-select-dropdown__item',
};


class HotelSearchPage {
  constructor(page) {
    this.page = page;
  }

  /** Switches UI to Hotel search */
  async clickHotelTab() {
    await this.page.click(SELECTORS.HOTEL_TAB);
  }

  /** Confirms hotel search UI is loaded */
  async waitForBookAndStayAtYourHotelText() {
    await waitForText(
      this.page,
      SELECTORS.HOTEL_HEADING,
      "Book and stay at your hotel",
    );
  }

  /**
   * Types hotel destination and confirms selection.
   *
   * Types into the destination field, uses TAB to accept the
   * autocomplete suggestion, and waits until the field loses
   * focus to ensure the selection was applied.
   *
   * @param {string} where - Hotel destination to search for
   */
  async typeHotelDestination(where) {
    const destinationField = this.page.locator(
      SELECTORS.HOTEL_DESTINATION_FIELD,
    );
    const firstSuggestion = this.page.locator(SELECTORS.AUTOCOMPLETE_FIRST_OPTION).first();

    // Ensure field is visible and ready
    await destinationField.waitFor({ state: "visible" });

    await destinationField.click();
    await destinationField.fill(where);

    try {
      await firstSuggestion.waitFor({ state: "visible", timeout: 5000 });
      await firstSuggestion.click();
    } catch {
      await pressTab(this.page);
    }

    // Small wait for UI to process the blur event
    await this.page.waitForTimeout(300);
  }

  /**
   * Opens the calendar by clicking the check-in field.
   */
  async clickCheckInField() {
    await this.page
      .locator(SELECTORS.CHECK_IN_INPUT)
      .click();
  }

  /**
   * Opens the rooms count dropdown in the hotel search form.
   */
  async openRoomsDropdown() {
    const dropdown = this.page.locator(SELECTORS.ROOMS_DROPDOWN);
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    await dropdown.click();
  }

  /**
   * Selects a room count option from the open rooms dropdown.
   * @param {number} count - Number of rooms to select (e.g. 2)
   */
  async selectRoomCount(count) {
    if (typeof count !== 'number') throw new Error('count must be a number, got: ' + typeof count);
    const label = count === 1 ? 'Room' : 'Rooms';
    await this.page
      .locator(SELECTORS.ROOMS_DROPDOWN_OPTION)
      .filter({ hasText: new RegExp('^' + count + '\\s+' + label, 'i') })
      .click();
  }

  /**
   * Types into the hotel destination field without selecting a suggestion.
   * Used when you want to trigger the autocomplete dropdown to inspect suggestions.
   * @param {string} text - Text to type in the destination field
   */
  async typeInHotelDestinationField(text) {
    const destinationField = this.page.locator(SELECTORS.HOTEL_DESTINATION_FIELD);
    await destinationField.waitFor({ state: 'visible', timeout: 10000 });
    await destinationField.click();
    await destinationField.fill(text);
  }

  /**
   * Checks if a location suggestion containing the given text is visible in the autocomplete dropdown.
   * @param {string} text - Text to look for in the suggestion list
   * @param {number} [timeout=10000]
   * @returns {Promise<boolean>} True if a matching suggestion is visible
   */
  async isLocationSuggestionVisible(text, timeout = 10000) {
    const suggestion = this.page.locator(SELECTORS.AUTOCOMPLETE_LIST).locator('li').filter({ hasText: text });
    try {
      await suggestion.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the current value of the hotel destination field.
   * Used to verify the field is pre-populated (e.g. from a flight destination).
   * @param {number} [timeout=10000]
   * @returns {Promise<string>} The destination input value
   */
  async getHotelDestinationValue({ timeout = 10000 } = {}) {
    const field = this.page.locator(SELECTORS.HOTEL_DESTINATION_FIELD);
    await field.waitFor({ state: 'visible', timeout });
    return (await field.inputValue()).trim();
  }
}

module.exports = HotelSearchPage;
