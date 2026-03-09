module.exports = {
  default: {
    paths: [
      'tests/features/**/*.feature'
    ],
    require: [
      'tests/support/world.js',   // World class
      'tests/support/hooks.js',   // Before/After hooks (includes alias registration)
      'tests/support/retry-handler.js',  // Retry handler for CI environments
      'tests/steps/**/*.js',
      'tests/support/**/*.js'
    ],
    format: [
      'progress',
      '@cucumber/pretty-formatter',
      'json:test-results/cucumber-report.json',  // For JSON reporting
      'junit:test-results/cucumber-junit.xml'    // For JUnit reporting
    ],
    // Retry configuration: Only used when CI=true (set in environment)
    // Usage in CI: RETRY_COUNT=2 RETRY_DELAY=2000 npx cucumber-js
    retry: process.env.CI ? 1 : 0,  // Retry once in CI, never locally
  }
};