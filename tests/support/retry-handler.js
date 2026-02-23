/**
 * Retry Handler for Cucumber Scenarios
 *
 * Implements retry logic for failed scenarios in CI environments.
 * - Only activates when CI=true (GitHub Actions, CI/CD environments)
 * - Retries are disabled in local development
 * - Configurable retry count and delay
 *
 * IMPORTANT:
 * - Retry is scenario-level, not step-level
 * - Failed scenarios are marked and excluded from first run
 * - Automatically re-run detected on test complete
 */

const logger = require("@utils/logger").child("RetryHandler");

const IS_CI = process.env.CI === "true";
const MAX_RETRIES = parseInt(process.env.RETRY_COUNT || "2", 10);
const RETRY_DELAY_MS = parseInt(process.env.RETRY_DELAY || "2000", 10);

/**
 * Track failed scenarios for retry
 * Format: Map<scenarioId, { pickle, attempt, lastError }>
 */
const failedScenarios = new Map();

/**
 * Record a failed scenario for potential retry
 * @param {Object} scenario - Cucumber scenario object
 * @param {Error} error - The error that caused failure
 * @param {number} attempt - Current attempt number (1-based)
 */
function recordFailure(scenario, error, attempt = 1) {
  if (!IS_CI) {
    logger.debug("Retry disabled - not in CI environment");
    return;
  }

  const scenarioId = scenario.pickle.name;
  const retryCount = failedScenarios.get(scenarioId)?.attempt || 0;

  if (retryCount < MAX_RETRIES) {
    failedScenarios.set(scenarioId, {
      pickle: scenario.pickle,
      attempt: retryCount + 1,
      lastError: error,
      uri: scenario.gherkinDocument?.uri,
    });

    logger.warn("Scenario scheduled for retry", { 
      scenario: scenarioId, 
      attempt: retryCount + 1,
      maxAttempts: MAX_RETRIES 
    });
  } else {
    logger.error("Max retries exceeded", { 
      scenario: scenarioId, 
      maxAttempts: MAX_RETRIES 
    });
  }
}

/**
 * Get all scenarios that should be retried
 * @returns {Array<Object>} List of failed scenarios eligible for retry
 */
function getFailedScenariosForRetry() {
  if (!IS_CI) return [];
  
  const toRetry = Array.from(failedScenarios.values()).filter(
    scenario => scenario.attempt < MAX_RETRIES
  );

  logger.info("Scenarios eligible for retry", { count: toRetry.length });
  return toRetry;
}

/**
 * Clear retry information (useful for test cleanup)
 */
function clearRetryState() {
  failedScenarios.clear();
  logger.debug("Retry state cleared");
}

/**
 * Wait before retrying (to avoid rapid fail loops)
 * @returns {Promise<void>}
 */
async function waitBeforeRetry() {
  if (!IS_CI || RETRY_DELAY_MS <= 0) return;
  
  logger.debug("Waiting before retry", { delayMs: RETRY_DELAY_MS });
  return new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
}

/**
 * Check if retries are enabled
 */
function isRetryEnabled() {
  return IS_CI && MAX_RETRIES > 0;
}

/**
 * Get retry configuration (for logging/debugging)
 */
function getRetryConfig() {
  return {
    enabled: isRetryEnabled(),
    isCI: IS_CI,
    maxRetries: MAX_RETRIES,
    retryDelayMs: RETRY_DELAY_MS,
  };
}

module.exports = {
  recordFailure,
  getFailedScenariosForRetry,
  clearRetryState,
  waitBeforeRetry,
  isRetryEnabled,
  getRetryConfig,
};
