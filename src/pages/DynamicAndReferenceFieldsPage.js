/**
 * DynamicAndReferenceFieldsPage
 *
 * Handles dynamic and reference fields that appear across multiple pages.
 * Low-level UI interactions only—no business logic.
 */

class DynamicAndReferenceFieldsPage {
  constructor(page) {
    this.page = page;
  }

  /**
   * Gets a locator for a dropdown field by name.
   * Dynamic because field names vary across different forms.
   *
   * @param {string} fieldName - The name attribute of the field.
   * @returns {Locator} Playwright locator for interacting with the field.
   */
  getDropdownField(fieldName) {
    return this.page.locator(`[name='${fieldName}']`);
  }

  /**
   * Gets a locator for a text field by index.
   *
   * @param {number} [index=0] - The index of the text field (default is first).
   * @returns {Locator} Playwright locator for the text field.
   */
  getTextFieldInput(index = 0) {
    return this.page.locator(".el-input__wrapper").nth(index).locator(".el-input__inner");
  }


  /**
   * Clicks the dropdown to open the list of options.
   *
   * @param {string} fieldName - The name attribute of the field to click.
   */
  async clickToOpenDropdown(fieldName) {
    await this.getDropdownField(fieldName).click();
  }

  /**
   * Gets a locator for a dropdown option by its visible name.
   *
   * @param {string} optionName - The visible text of the option.
   * @returns {Locator} Playwright locator for the option.
   */
  getDropdownOption(optionName) {
    return this.page.getByRole("option", { name: optionName });
  }

  /**
   * Scrolls to a text field by index.
   * Uses the same locator as getTextFieldInput for consistency.
   *
   * @param {number} [index=0] - The index of the text field to scroll to.
   * @returns {Promise<void>}
   */
  async scrollToTextField(index = 0) {
    const field = this.page.locator(".el-input__wrapper").nth(index);
    await field.waitFor({ state: "visible", timeout: 10000 });
    await field.scrollIntoViewIfNeeded();
  }

  /**
   * Waits for a dropdown option to appear.
   *
   * @param {string} optionName - The name of the option to wait for.
   */
  async waitForDropdownOption(optionName) {
    await this.getDropdownOption(optionName).waitFor({ state: "visible" });
  }

  /**
   * Selects a dropdown option by its visible name.
   *
   * @param {string} optionName - The name of the option to select.
   */
  async selectDropdownOption(optionName) {
    await this.getDropdownOption(optionName).click();
  }

  /**
   * Fills in a text field by index with the provided text.
   *
   * @param {string} text - The text to enter in the field.
   * @param {number} [index=0] - The index of the text field (default is first).
   * @param {boolean} [shouldScroll=true] - Whether to scroll to the field before filling (default is true).
   */
  async fillInTextField(text, index = 0, shouldScroll = true) {
    if (shouldScroll) {
      await this.scrollToTextField(index);
    }
    await this.getTextFieldInput(index).fill(text);
  }


}

module.exports = DynamicAndReferenceFieldsPage;
