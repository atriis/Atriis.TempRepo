/**
 * PDF Utility Functions
 *
 * Minimal, dependency-free text extraction from a downloaded PDF, used by assertions that need to
 * read what a generated document actually contains (e.g. ADO 55723 — the hotel voucher must not
 * show prices).
 *
 * Why hand-rolled instead of a library: the repo has no PDF dependency, and adding one to the QA
 * framework changes CI's install surface. A PDF content stream is a small, well-defined format for
 * this purpose — Flate-compressed segments carrying text-showing operators — and Node's built-in
 * zlib is enough to read it.
 *
 * Its one real limitation: a PDF whose fonts use a custom/CID encoding stores glyph indices rather
 * than readable characters, so no extractor of this kind can recover the text. Callers must treat
 * "no readable text" as an ERROR and never as a passing absence assertion — see
 * `assertPdfTextIsReadable`. If a supplier's voucher ever hits that case, the fix is to add a real
 * PDF text extractor (e.g. pdf-parse) rather than to weaken the assertion.
 */

const fs = require("fs");
const zlib = require("zlib");

// A PDF whose extracted text has fewer readable letters than this is treated as unreadable rather
// than as "a document with no prices in it". Vouchers carry addresses, dates, and labels, so real
// extracted text clears this comfortably; a CID-encoded or image-only PDF lands near zero.
const MIN_READABLE_LETTERS = 100;

/**
 * Inflates every Flate-compressed `stream ... endstream` segment in a PDF buffer.
 * Segments that are not Flate-compressed (or fail to inflate) are kept as raw latin1 text, since an
 * uncompressed content stream carries the same text operators in the clear.
 *
 * @param {Buffer} buffer - Raw bytes of the PDF file
 * @returns {string[]} Decoded content-stream segments
 */
function decodeStreamSegments(buffer) {
  const segments = [];
  const haystack = buffer.toString("latin1");
  const streamKeyword = /stream\r?\n?/g;

  let match;
  while ((match = streamKeyword.exec(haystack)) !== null) {
    const start = match.index + match[0].length;
    const end = haystack.indexOf("endstream", start);
    if (end === -1) break;

    const raw = buffer.subarray(start, end);
    let decoded = null;

    for (const inflate of [zlib.inflateSync, zlib.inflateRawSync]) {
      try {
        decoded = inflate(raw).toString("latin1");
        break;
      } catch {
        // Not Flate-compressed with this variant — try the next, then fall back to the raw bytes.
      }
    }

    segments.push(decoded !== null ? decoded : raw.toString("latin1"));
    streamKeyword.lastIndex = end;
  }

  return segments;
}

/**
 * Unescapes a PDF literal string body (the part inside the parentheses).
 *
 * @param {string} body - Literal string body, e.g. `Total\: 1,234.56`
 * @returns {string} Unescaped text
 */
function unescapeLiteral(body) {
  return body
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8)))
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([()\\])/g, "$1");
}

/**
 * Decodes a PDF hex string body (the part inside the angle brackets).
 * UTF-16BE hex strings are common for accented text, so a leading BOM is honoured.
 *
 * @param {string} body - Hex string body, e.g. `48656C6C6F`
 * @returns {string} Decoded text
 */
function decodeHexString(body) {
  const hex = body.replace(/[^0-9a-fA-F]/g, "");
  if (hex.length < 2) return "";

  const bytes = Buffer.from(hex.length % 2 === 0 ? hex : `${hex}0`, "hex");
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return bytes.subarray(2).swap16().toString("utf16le");
  }
  return bytes.toString("latin1");
}

/**
 * Pulls the text out of one decoded content-stream segment.
 *
 * Every literal `(...)` and hex `<...>` string in a content stream is a text operand, so collecting
 * them in document order reconstructs the readable content. Kerning numbers between the pieces of a
 * `TJ` array are dropped, which means a single word can arrive split — callers must never assume
 * word boundaries survive (see `containsAmount`, which compares digit runs for exactly that reason).
 *
 * @param {string} segment - Decoded content-stream text
 * @returns {string} Extracted text
 */
function extractSegmentText(segment) {
  const pieces = [];
  // Literal strings, honouring backslash escapes so an escaped ")" does not end the match early.
  const literals = /\((?:\\.|[^\\()])*\)/gs;
  // Hex strings, excluding the "<<" that opens a dictionary.
  const hexStrings = /<([0-9a-fA-F\s]+)>/g;

  const ordered = [];
  let match;
  while ((match = literals.exec(segment)) !== null) {
    ordered.push({ index: match.index, text: unescapeLiteral(match[0].slice(1, -1)) });
  }
  while ((match = hexStrings.exec(segment)) !== null) {
    ordered.push({ index: match.index, text: decodeHexString(match[1]) });
  }

  ordered.sort((a, b) => a.index - b.index);
  for (const piece of ordered) pieces.push(piece.text);

  return pieces.join(" ");
}

/**
 * Extracts the readable text from a PDF file on disk.
 *
 * @param {string} filePath - Absolute path to the PDF
 * @returns {string} Extracted text (may be empty if the PDF carries no readable text)
 * @throws {Error} If the path is missing or the file cannot be read
 */
function extractPdfText(filePath) {
  if (typeof filePath !== "string" || !filePath.trim()) {
    throw new Error(`[pdf.extractPdfText] "filePath" must be a non-empty string, got: ${typeof filePath}`);
  }

  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(`[pdf.extractPdfText] Could not read the PDF at "${filePath}". Original: ${err.message}`);
  }

  const text = decodeStreamSegments(buffer).map(extractSegmentText).join("\n");
  return text.replace(/[ \t]+/g, " ").trim();
}

/**
 * Counts the readable letters in extracted text, used as the sanity floor for "this PDF was actually
 * parsed" before any absence assertion is trusted.
 *
 * @param {string} text - Extracted PDF text
 * @returns {number} Number of alphabetic characters
 */
function countLetters(text) {
  const letters = String(text || "").match(/[A-Za-zÀ-ɏ]/g);
  return letters ? letters.length : 0;
}

/**
 * Guards an absence assertion: throws when the extracted text is too thin to have been read
 * properly, so an unparsed PDF can never masquerade as "contains no prices".
 *
 * @param {string} text - Extracted PDF text
 * @param {string} context - Caller label used in the error message
 * @param {string} filePath - Path of the PDF, for the error message
 * @returns {number} The letter count, when it clears the floor
 * @throws {Error} If the text carries fewer than MIN_READABLE_LETTERS letters
 */
function assertPdfTextIsReadable(text, context, filePath) {
  const letters = countLetters(text);
  if (letters >= MIN_READABLE_LETTERS) return letters;

  throw new Error(
    `[${context}] Extracted only ${letters} readable letters from "${filePath}" (need at least ` +
      `${MIN_READABLE_LETTERS}), so its contents could not be verified. This is reported as a failure on ` +
      "purpose: an unreadable PDF must never pass an assertion about what it does NOT contain. Likely the " +
      "document uses custom/CID font encoding or is image-only, which the dependency-free extractor in " +
      "src/utils/pdf.js cannot decode — a real PDF text extractor (e.g. pdf-parse) would be needed.",
  );
}

/**
 * Parses the numeric value out of a currency-anchored amount such as "1,234.56 USD" or "EUR 12,00".
 *
 * Separator handling is decided by the last separator in the string: when it is followed by exactly
 * two digits it is the decimal point (so both "1,234.56" and "1.234,56" read as 1234.56), otherwise
 * every separator is a thousands separator.
 *
 * @param {string} raw - A currency amount as found in the document
 * @returns {number|null} The parsed value, or null when it cannot be read
 */
function parseCurrencyAmount(raw) {
  const numeric = String(raw || "").replace(/[^0-9.,]/g, "");
  if (!numeric) return null;

  const lastSeparator = Math.max(numeric.lastIndexOf(","), numeric.lastIndexOf("."));
  let normalized;
  if (lastSeparator !== -1 && numeric.length - lastSeparator - 1 === 2) {
    const whole = numeric.slice(0, lastSeparator).replace(/[.,]/g, "");
    normalized = `${whole}.${numeric.slice(lastSeparator + 1)}`;
  } else {
    normalized = numeric.replace(/[.,]/g, "");
  }

  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Builds the ways an amount can legitimately be written in a document, always keeping an explicit
 * decimal separator: "1234.56", "1234,56", "1,234.56", "1.234,56".
 *
 * The separator is what makes a match trustworthy. A separator-less form ("123456") is deliberately
 * NOT generated — see containsAmount.
 *
 * @param {number} amount - Amount to render, e.g. 1234.56
 * @returns {string[]} Unique formatted forms, whitespace-free
 */
function amountVariants(amount) {
  const fixed = amount.toFixed(2);
  const [whole, cents] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const variants = [
    `${whole}.${cents}`,
    `${whole},${cents}`,
    `${grouped}.${cents}`,
    `${grouped.replace(/,/g, ".")},${cents}`,
  ];
  return variants.filter((variant, index, all) => all.indexOf(variant) === index);
}

/**
 * Checks whether a numeric amount appears in extracted PDF text.
 *
 * Two signals, because neither alone is both safe and sufficient:
 *
 *  1. **Currency-anchored numeric match** — every amount `findCurrencyAmounts` recognises is parsed
 *     and compared numerically, so a rounded total ("USD 131" for 130.58) is caught too. Precise: it
 *     can only match text the document itself presents as money.
 *  2. **Formatted-form match** — the amount's written forms (see amountVariants) searched in the text
 *     with whitespace removed. Removing whitespace is what survives PDF extraction: a `TJ` array can
 *     split "130.58" into separate runs, which this extractor rejoins as "130 .58", so stripping
 *     spaces restores the amount while every other character still bounds the match.
 *
 * What is deliberately NOT done is matching the amount's bare digits against the document's
 * concatenated digits. That was the first implementation, and ADO 55723's first real run showed why
 * it is unsafe: a French voucher containing no prices at all failed, because the cents-less run
 * "130" turned up among the voucher's dates, phone numbers, and confirmation codes. Concatenating
 * every digit in a document destroys the boundaries that make a numeric match meaningful, and even a
 * 5-digit run can land inside a longer confirmation number ("4130582" contains "13058").
 *
 * @param {string} text - Extracted PDF text
 * @param {number} amount - Amount to look for, e.g. 1234.56
 * @returns {{found: boolean, matched: string|null, via: string|null}} What matched, and by which signal
 */
function containsAmount(text, amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new Error(`[pdf.containsAmount] "amount" must be a finite number, got: ${amount}`);
  }

  // Signal 1 — anything the document presents as a currency amount, compared numerically.
  for (const raw of findCurrencyAmounts(text)) {
    const value = parseCurrencyAmount(raw);
    if (value === null) continue;
    if (Math.abs(value - amount) < 0.01 || Math.abs(value - Math.round(amount)) < 0.01) {
      return { found: true, matched: raw, via: "currency amount" };
    }
  }

  // Signal 2 — the amount's written forms, in whitespace-free text.
  const haystack = String(text || "").replace(/\s+/g, "");
  for (const variant of amountVariants(amount)) {
    if (haystack.includes(variant)) {
      return { found: true, matched: variant, via: "formatted amount" };
    }
  }

  return { found: false, matched: null, via: null };
}

/**
 * Finds currency amounts in extracted PDF text — an amount next to a currency code or symbol.
 *
 * Deliberately anchored on currency rather than on any decimal number: a voucher legitimately
 * contains dates, phone numbers, and confirmation codes, and flagging those as "prices" would make
 * the assertion useless.
 *
 * @param {string} text - Extracted PDF text
 * @returns {string[]} Unique currency amounts found, in document order
 */
function findCurrencyAmounts(text) {
  const haystack = String(text || "");
  const patterns = [
    /(?:USD|EUR|GBP|CHF|ILS|AUD|CAD|NZD|SEK|NOK|DKK|JPY)\s*[0-9][0-9., ]*[0-9]/gi,
    /[0-9][0-9., ]*[0-9]\s*(?:USD|EUR|GBP|CHF|ILS|AUD|CAD|NZD|SEK|NOK|DKK|JPY)/gi,
    /[$€£₪¥]\s*[0-9][0-9., ]*[0-9]/g,
  ];

  const found = [];
  for (const pattern of patterns) {
    const matches = haystack.match(pattern);
    if (!matches) continue;
    for (const raw of matches) {
      const normalized = raw.replace(/\s+/g, " ").trim();
      if (!found.includes(normalized)) found.push(normalized);
    }
  }
  return found;
}

module.exports = {
  MIN_READABLE_LETTERS,
  extractPdfText,
  countLetters,
  assertPdfTextIsReadable,
  parseCurrencyAmount,
  amountVariants,
  containsAmount,
  findCurrencyAmounts,
};
