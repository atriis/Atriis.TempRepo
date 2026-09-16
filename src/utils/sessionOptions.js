/**
 * Per-scenario browser-context overrides.
 *
 * Cucumber's world (`this`) is not reachable from App.createBrowserSession() — the session is
 * opened by a step definition, several calls below the Before hook that knows the scenario's
 * tags. This module is the seam between them: the Before hook writes the overrides it parsed
 * off the tags, createBrowserSession() reads them when it builds the context.
 *
 * Module-level state is safe here because cucumber-js `--parallel` forks one PROCESS per worker
 * and each worker runs its scenarios serially — no two scenarios share this module at once. The
 * Before hook still resets it per scenario so a tagged scenario can never leak its timezone into
 * the next untagged one running in the same worker.
 */

let overrides = {};

module.exports = {
  /**
   * Replaces the overrides for the scenario that is about to run.
   *
   * @param {{ timezoneId?: string }} next
   */
  set(next = {}) {
    overrides = { ...next };
  },

  /**
   * Returns the current scenario's context overrides. Empty object when untagged — the caller
   * spreads it, so an empty object leaves Playwright's own defaults untouched.
   *
   * @returns {{ timezoneId?: string }}
   */
  get() {
    return { ...overrides };
  },

  reset() {
    overrides = {};
  },
};
