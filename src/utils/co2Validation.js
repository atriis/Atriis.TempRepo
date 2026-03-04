/**
 * Shared CO2 validation helper.
 *
 * Centralises the repeated pattern of:
 *   1. Checking visibility of the eco-label
 *   2. Reading and validating the numeric CO2 value
 *
 * Used by HotelLevelResults, RoomLevelResults, and Cart DSL methods.
 *
 * @param {() => Promise<boolean>} isCO2LabelVisible - Async fn that returns true if label is visible
 * @param {() => Promise<string>}  getCO2Value       - Async fn that returns the CO2 text value
 * @param {string}                 context           - Human-readable location for error messages
 * @returns {Promise<{visible: boolean, value: string}>}
 */
async function assertCO2Displayed(isCO2LabelVisible, getCO2Value, context) {
  const isVisible = await isCO2LabelVisible();
  if (!isVisible) {
    throw new Error(`CO2 eco-label is not visible in ${context}`);
  }

  const value = await getCO2Value();
  const numericValue = parseFloat(value.replace(/,/g, ''));

  if (isNaN(numericValue) || numericValue <= 0) {
    throw new Error(`CO2 value must be a positive number, got: "${value}" (${context})`);
  }

  return { visible: true, value };
}

module.exports = { assertCO2Displayed };
