/**
 * Converts numbers or formatted numeric strings into a JS number.
 * Examples:
 *  - 176.87           -> 176.87
 *  - "176.87"         -> 176.87
 *  - "1,987.23"       -> 1987.23
 *  - "€ 1,987.23"     -> 1987.23
 *  - "  1,987.23  "   -> 1987.23
 */
function toNumber(value, label = 'value') {
  if (value == null) {
    throw new Error(`${label} is null/undefined`);
  }

  if (typeof value === 'number') {
    if (Number.isNaN(value)) throw new Error(`${label} is NaN`);
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`${label} must be a number or string, got ${typeof value}`);
  }

  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is an empty string`);

  // Keep digits, minus, comma, dot. Remove currency symbols/letters/spaces.
  const cleaned = trimmed.replace(/[^\d.,-]/g, '');

  // If both comma and dot exist, assume comma is thousands separator:
  // "1,987.23" -> remove commas -> "1987.23"
  // If only comma exists, treat it as decimal separator:
  // "176,87" -> "176.87"
  let normalized = cleaned;
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    normalized = normalized.replace(/,/g, '');
  } else if (hasComma && !hasDot) {
    normalized = normalized.replace(/,/g, '.');
  }

  const num = Number(normalized);
  if (Number.isNaN(num)) {
    throw new Error(`${label} could not be parsed as a number. Original: "${value}", cleaned: "${cleaned}", normalized: "${normalized}"`);
  }

  return num;
}

module.exports = {
  toNumber,
};