module.exports = {
  default: {
    require: [
      'tests/support/world.js',
      'tests/support/hooks.js',
      'tests/support/retry-handler.js',
      'tests/steps/**/*.js',
      'tests/support/**/*.js'
    ],
    format: [
      'summary',
      '@cucumber/pretty-formatter',
      'json:test-results/cucumber-report.json',
      'junit:test-results/cucumber-junit.xml',
      'allure-cucumberjs/reporter'
    ],
    retry: process.env.CI ? 1 : 0,
  }
};