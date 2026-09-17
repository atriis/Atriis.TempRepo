const knownErrors = require("@config/knownBookingErrors");
const logger = require("@utils/logger").child("BookingErrorHandler");

/**
 * Booking Error Handler
 * 
 * Manages known supplier booking errors and determines whether to skip or fail tests.
 * Prevents test failures due to supplier-specific issues.
 */
class BookingErrorHandler {
  static normalizeErrorValue(value) {
    if (!value) return '';
    return String(value)
      .toUpperCase()
      .replace(/[*]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static matchesKnownError(knownError, errorValue) {
    const known = this.normalizeErrorValue(knownError);
    const candidate = this.normalizeErrorValue(errorValue);

    if (!known || !candidate) return false;
    return candidate.includes(known);
  }

  /**
   * Checks if a booking error is known by supplier token or message text.
   * 
   * @param {string} product - Product type: "transportation", "flights", "hotels"
   * @param {string} subProduct - Sub-product type: "cars", "rails", etc. (optional, for transportation)
   * @param {string} errorValue - Supplier name or booking error message text
   * @returns {boolean} True if the value matches a known error
   */
  static isKnownBookingError(product, subProduct, errorValue) {
    if (!errorValue) return false;
    
    // Get product config
    const productConfig = knownErrors[product];
    if (!productConfig) {
      logger.warn("Unknown product in booking error config", { product });
      return false;
    }

    // For transportation, check sub-product (cars, rails, etc.)
    if (product === "transportation" && subProduct) {
      const subProductConfig = productConfig[subProduct];
      if (!subProductConfig) {
        logger.warn("Unknown sub-product in booking error config", { product, subProduct });
        return false;
      }
      
      const knownErrorList = Array.isArray(subProductConfig.knownErrors) 
        ? subProductConfig.knownErrors 
        : [];
      
      return knownErrorList.some((knownError) => this.matchesKnownError(knownError, errorValue));
    }

    // For other products, check directly
    const knownErrorList = Array.isArray(productConfig.knownErrors) 
      ? productConfig.knownErrors 
      : [];
    
    return knownErrorList.some((knownError) => this.matchesKnownError(knownError, errorValue));
  }

  /**
   * Logs a booking error and returns whether the test should be skipped.
   *
   * Callers that matched the error against more than one value (the supplier
   * line AND the full dialog text) pass their own verdict in `options.known`,
   * or the log would re-derive it from the single value logged here and could
   * print "FAIL TEST" for an error the caller is about to skip.
   *
   * @param {string} product - Product type
   * @param {string} supplierName - Supplier name
   * @param {string} subProduct - Sub-product type (optional, for transportation)
   * @param {{known?: boolean}} [options] - the caller's own known-error verdict
   * @returns {boolean} True if test should be skipped, false if it should fail
   */
  static handleBookingError(product, supplierName, subProduct, options = {}) {
    const isKnown = options.known === undefined
      ? this.isKnownBookingError(product, subProduct, supplierName)
      : Boolean(options.known);
    const knownErrorSource = knownErrors.getKnownErrorSource?.(
      product,
      subProduct,
      supplierName
    );

    if (isKnown) {
      logger.warn("Known Booking Error", { 
        product, 
        subProduct, 
        supplier: supplierName,
        source: knownErrorSource === "unknown" ? "json" : knownErrorSource,
        action: "SKIP TEST - Known supplier issue"
      });
      return true; // Skip the test
    }

    logger.error("Unknown Booking Error", { 
      product, 
      subProduct, 
      supplier: supplierName,
      action: "FAIL TEST - Unexpected supplier issue"
    });
    return false; // Don't skip - fail the test
  }

  /**
   * Builds the one-line supplier detail used in booking failure messages.
   *
   * Prefers the dialog's "supplier:" line - the only part that names the actual
   * failure - and falls back to the full dialog text when that line could not be
   * read. Whitespace is collapsed so the message stays on one line in the CI
   * summary table and in the JUnit XML.
   *
   * @param {{supplier?: string|null, bookingErrorText?: string|null}} result - a
   *   booking result returned by the Cart/Checkout DSL
   * @returns {string} The supplier's own words, or an explicit "could not read" note
   */
  static describeSupplierResponse(result) {
    const detail = String(result?.supplier || result?.bookingErrorText || "")
      .replace(/\s+/g, " ")
      .trim();

    return detail || "no message could be read from the dialog";
  }

  /**
   * Builds the message a step attaches to the report when a known booking error
   * skips the scenario.
   *
   * A pending step carries no error_message, so without this the CI summary can
   * only print "pending step: <step text>" and never says why the booking
   * stopped. The wording deliberately matches the thrown booking failures, so a
   * skipped booking and a failed one read the same way.
   *
   * @param {string} source - the DSL call that hit the error, e.g. "Cart.holdTrip"
   * @param {string} consequence - what the error prevented, e.g. "the trip was never put on hold"
   * @param {{supplier?: string|null, bookingErrorText?: string|null}} result - the booking result
   * @returns {string} A single-line reason, ready to attach or log
   */
  static describeSkippedBooking(source, consequence, result) {
    return (
      `[${source}] A known booking error modal blocked the booking, so ${consequence} ` +
      `and the scenario was skipped. Supplier response: ${this.describeSupplierResponse(result)}`
    );
  }

  /**
   * Gets the skip-on-error configuration for a product.
   * 
   * @param {string} product - Product type
   * @param {string} subProduct - Sub-product type (optional, for transportation)
   * @returns {boolean} Whether to skip on error for this product
   */
  static getSkipOnErrorConfig(product, subProduct) {
    const productConfig = knownErrors[product];
    if (!productConfig) return false;

    if (product === "transportation" && subProduct) {
      const subProductConfig = productConfig[subProduct];
      return subProductConfig?.skipOnError ?? false;
    }

    return productConfig.skipOnError ?? false;
  }
}

module.exports = BookingErrorHandler;
