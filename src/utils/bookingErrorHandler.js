const knownErrors = require("@config/knownBookingErrors.json");
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
   * @param {string} product - Product type
   * @param {string} supplierName - Supplier name
   * @param {string} subProduct - Sub-product type (optional, for transportation)
   * @returns {boolean} True if test should be skipped, false if it should fail
   */
  static handleBookingError(product, supplierName, subProduct) {
    const isKnown = this.isKnownBookingError(product, subProduct, supplierName);
    
    if (isKnown) {
      logger.warn("Known Booking Error", { 
        product, 
        subProduct, 
        supplier: supplierName,
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
