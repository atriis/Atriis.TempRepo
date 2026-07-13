module.exports = {
  default: {
    // Each support file must be loaded exactly once. Listing world.js/hooks.js
    // explicitly AND matching them again via 'tests/support/**/*.js' double-loaded
    // them: on a cold module cache (Windows case-insensitive FS + module-alias path
    // rewriting) the two specifiers can resolve to different cache keys, so world.js
    // ran twice and the second setWorldConstructor fired outside cucumber's BUILDING
    // window -> "instance of Cucumber that isn't running (status: PENDING)".
    // Support loads before steps because hooks.js registers module-alias, which the
    // step files rely on to resolve their @-aliased requires at load time.
    require: [
      'tests/support/**/*.js',
      'tests/steps/**/*.js',
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