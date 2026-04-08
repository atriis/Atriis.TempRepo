/**
 * Text Utility Functions
 *
 * Provides string manipulation helpers for test assertions and locators.
 */

/**
 * Escapes special regex characters in a string.
 *
 * @param {string} text - The string to escape
 * @returns {string} Escaped string safe for use in RegExp
 * @throws {Error} If input is not a string
 */
function escapeRegex(text) {
  if (typeof text !== "string") {
    throw new Error(`escapeRegex expects a string, got ${typeof text}`);
  }

  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Normalizes whitespace in a string (collapses multiple spaces, trims).
 *
 * @param {string} text - The string to normalize
 * @returns {string} Normalized string, or empty string if input is not a string
 */
function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Creates a case-insensitive RegExp for partial text matching.
 *
 * @param {string} text - The text to search for
 * @returns {RegExp} Case-insensitive regex for the text
 */
function caseInsensitiveContains(text) {
  return new RegExp(escapeRegex(text), "i");
}

// escapeRegExp is an alias for escapeRegex (used by page objects)
const escapeRegExp = escapeRegex;

module.exports = {
  escapeRegex,
  escapeRegExp,
  normalizeText,
  caseInsensitiveContains,
};
