module.exports = {
  default: {
    require: [
      'tests/support/world.js',   // World class
      'tests/support/hooks.js',   // Before/After hooks (includes alias registration)
      'tests/steps/**/*.js',
      'tests/support/**/*.js'
    ],
    format: [
      'progress',
      '@cucumber/pretty-formatter',
      'json:test-results/cucumber-report.json',  // For JSON reporting
      'junit:test-results/cucumber-junit.xml'    // For JUnit reporting
    ]
  }
};