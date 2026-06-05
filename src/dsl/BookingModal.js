const BookingInterruptionModalPage = require("@pages/BookingInterruptionModalPage");
const { getPageObject } = require("@utils/pageObjectCache");
const logger = require("@utils/logger").child("BookingModal");

const DEFAULT_TEXT_VALUE = "Test";
const MAX_MODAL_ITERATIONS = 3;

/**
 * BookingModal DSL
 *
 * Auto-handles booking-flow interruption modals (reference field questionnaires,
 * financial reference modals, etc.) that may appear after search, add-to-cart,
 * or checkout without being part of the test scenario itself.
 *
 * Intended to be called via the @nomodalneeded AfterStep hook.
 * Can also be called explicitly mid-flow when a modal is expected but irrelevant
 * to the test assertion.
 */
const BookingModal = {
  /**
   * Detects a visible booking interruption modal and handles it automatically:
   *   1. Expands any collapsed sections.
   *   2. Fills all required fields with default values (first option for dropdowns,
   *      defaultTextValue for text/textarea, checked for checkboxes).
   *   3. Clicks the Proceed / Save button and waits for the modal to close.
   *   4. Repeats up to maxIterations times in case a second modal appears immediately
   *      after the first (e.g. financial-reference → reference-field questionnaire).
   *
   * Returns immediately with { handled: false } if no modal is visible within timeout.
   *
   * @param {Object} page - Playwright page instance
   * @param {Object} [options]
   * @param {number} [options.timeout=300]        ms to wait before deciding no modal is present
   * @param {string} [options.defaultTextValue]   Default text for text / textarea fields
   * @param {number} [options.maxIterations=3]    Max sequential modals to handle per call
   * @returns {Promise<{ handled: boolean, handledCount: number }>}
   */
  async handleIfPresent(
    page,
    { timeout = 300, defaultTextValue = DEFAULT_TEXT_VALUE, maxIterations = MAX_MODAL_ITERATIONS } = {}
  ) {
    if (!page) throw new Error("[BookingModal.handleIfPresent] page is required");

    const modalPage = getPageObject(page, BookingInterruptionModalPage);
    let handledCount = 0;

    for (let i = 0; i < maxIterations; i++) {
      // For the first iteration use the caller-supplied timeout (short by default).
      // For subsequent iterations give Vue up to 500ms to render the next modal.
      const checkTimeout = i === 0 ? timeout : 500;
      const isVisible = await modalPage.isVisible(checkTimeout);
      if (!isVisible) break;

      logger.info("Booking interruption modal detected — auto-handling", { iteration: i + 1 });

      try {
        await BookingModal._fillAndProceed(modalPage, defaultTextValue);
        handledCount++;
      } catch (err) {
        throw new Error(
          `[BookingModal.handleIfPresent] Failed to auto-handle booking interruption modal ` +
          `(iteration ${i + 1}/${maxIterations}). Original: ${err.message}`
        );
      }
    }

    if (handledCount > 0) {
      logger.info("Booking interruption modals handled", { handledCount });
    }

    return { handled: handledCount > 0, handledCount };
  },

  /**
   * Internal: fills all required fields in a currently visible modal, then clicks Proceed.
   * @param {BookingInterruptionModalPage} modalPage
   * @param {string} defaultTextValue
   */
  async _fillAndProceed(modalPage, defaultTextValue) {
    // Reveal any sections hidden in collapsed panels
    await modalPage.expandCollapsedSections();

    // Financial reference has its own caret-click pattern
    if (
      await modalPage.isFinancialReferenceSectionVisible() &&
      await modalPage.isFinancialReferenceRequired()
    ) {
      logger.debug("Filling financial reference dropdown");
      await modalPage.fillFinancialReference();
    }

    // Fill every required questionnaire field
    const containers = modalPage.getRequiredFieldContainers();
    const count = await containers.count();
    logger.debug("Required field containers found", { count });

    for (let i = 0; i < count; i++) {
      const container = containers.nth(i);
      const fieldType = await modalPage.getFieldType(container);
      logger.debug("Filling required field", { index: i, fieldType });

      switch (fieldType) {
        case "dropdown":
          await modalPage.fillDropdownField(container);
          break;
        case "textbox":
          await modalPage.fillTextField(container, defaultTextValue);
          break;
        case "textarea":
          await modalPage.fillTextareaField(container, defaultTextValue);
          break;
        case "checkbox":
          await modalPage.checkCheckboxField(container);
          break;
        default:
          logger.warn("Unknown field type in booking modal — skipping", { fieldType });
      }
    }

    await modalPage.clickProceed();
    await modalPage.waitForModalToClose();
  },
};

module.exports = BookingModal;
