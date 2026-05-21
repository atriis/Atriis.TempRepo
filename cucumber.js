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
      'allure-cucumberjs/reporter',
      'rerun:test-results/rerun.txt'
    ],
    retry: process.env.CI ? parseInt(process.env.RETRY_COUNT || '2', 10) : 0,
  }
};