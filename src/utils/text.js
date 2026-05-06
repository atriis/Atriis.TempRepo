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

/**
 * Normalizes text for strict comparison (case-insensitive with special char removal).
 * Used for address and label matching where special characters should not affect comparison.
 *
 * - Converts to lowercase
 * - Removes special characters (replaces with spaces)
 * - Collapses multiple spaces to single space
 * - Trims leading/trailing whitespace
 *
 * @param {string|any} value - Text to normalize (coerced to string)
 * @returns {string} Normalized text
 */
function normalizeTextStrict(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes an address string into normalized words.
 * Uses strict normalization for comparison.
 * Useful for scoring partial address matches.
 *
 * @param {string} value - Address text to tokenize
 * @returns {string[]} Array of normalized tokens (words with length >= 2)
 */
function tokenizeAddress(value) {
  return normalizeTextStrict(value)
    .split(' ')
    .filter((token) => token.length >= 2);
}

/**
 * Builds a flexible regex pattern for matching address parts separated by commas.
 * Used for fuzzy address matching where partial or reordered components should match.
 *
 * - Splits address by commas
 * - Escapes each part for safe regex use
 * - Joins with flexible pattern to allow any characters between parts
 * - Returns case-insensitive regex
 *
 * @param {string} address - Address text with comma-separated parts
 * @returns {RegExp} Case-insensitive regex that matches the address parts
 * @example
 *   buildFlexibleAddressRegex('Main St, New York')
 *   // Matches: "main st...new york", "Main St, NY", etc.
 */
function buildFlexibleAddressRegex(address) {
  const parts = String(address)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return /$^/;
  }

  const pattern = parts.map((part) => escapeRegex(part)).join('[\\s\\S]*');
  return new RegExp(pattern, 'i');
}

// escapeRegExp is an alias for escapeRegex (used by page objects)
const escapeRegExp = escapeRegex;

module.exports = {
  escapeRegex,
  escapeRegExp,
  normalizeText,
  normalizeTextStrict,
  tokenizeAddress,
  buildFlexibleAddressRegex,
  caseInsensitiveContains,
};
