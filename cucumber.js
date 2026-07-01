module.exports = {
  default: {
    require: [
      'tests/support/world.js',
      'tests/support/hooks.js',
      'tests/steps/**/*.js',
      'tests/support/**/*.js',
      'node_modules/allure-cucumberjs'
    ],
    format: [
      'summary',
      '@cucumber/pretty-formatter',
      'json:test-results/cucumber-report.json',
      'junit:test-results/cucumber-junit.xml',
      // Incremental NDJSON stream: written event-by-event as scenarios finish,
      // so a timed-out/killed run still leaves completed scenarios on disk.
      // The CI report job recovers counts from this when the JSON above is
      // missing (see .github/scripts/reconcile-suites.js).
      'message:test-results/messages.ndjson',
      'allure-cucumberjs/reporter',
      'rerun:test-results/rerun.txt'
    ],
    // CI retries once (was 2): a 3rd attempt rarely converts on the chronically
    // hard-failing suites and mostly burns wall time toward the step timeout.
    // Override per-run with RETRY_COUNT if a suite genuinely needs more.
    retry: process.env.CI ? parseInt(process.env.RETRY_COUNT || '1', 10) : 0,
  }
};