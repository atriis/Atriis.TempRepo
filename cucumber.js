// Support loads before steps because hooks.js registers module-alias, which the
// step files rely on to resolve their @-aliased requires at load time.
//
// Each support file must be loaded exactly once. Listing world.js/hooks.js
// explicitly AND matching them again via 'tests/support/**/*.js' double-loaded
// them: on a cold module cache (Windows case-insensitive FS + module-alias path
// rewriting) the two specifiers can resolve to different cache keys, so world.js
// ran twice and the second setWorldConstructor fired outside cucumber's BUILDING
// window -> "instance of Cucumber that isn't running (status: PENDING)".
//
// Allure lives ONLY in the `ci` profile:
//   * Nothing in this repo uses the allure runtime API (allure.step/label/...),
//     so the old `node_modules/allure-cucumberjs` support-code require was dead
//     weight. That entry loads allure's index.js, which calls BeforeAll/Before at
//     load time against cucumber's support-code builder — the deterministic source
//     of the Windows "instance ... isn't running (status: PENDING)" error at
//     hooks.js (a duplicate @cucumber/cucumber cache key). Removed entirely.
//   * allure-results/ is only ever consumed in CI (uploaded + rendered into a
//     report by test-suite.yml). Keeping just the `allure-cucumberjs/reporter`
//     formatter in the `ci` profile lets local runs (`npx cucumber-js`,
//     `npm run bdd`) stay clean while CI (Linux, case-sensitive FS — no race)
//     still produces allure output. CI runs `npx cucumber-js <path> --profile ci`.

// The .cjs dedupe shim MUST be first — it makes the Windows CJS module cache
// case-insensitive before any support file requires '@cucumber/cucumber', which
// prevents the intermittent duplicate-instance PENDING error (drive-letter case
// divergence between the CLI and cwd-derived glob paths). It ends in .cjs so the
// 'tests/support/**/*.js' glob below does NOT also match it (no double-load).
const requires = [
  "tests/support/win-module-cache-dedupe.cjs",
  "tests/support/**/*.js",
  "tests/steps/**/*.js",
];

const baseFormat = [
  "summary",
  "@cucumber/pretty-formatter",
  "json:test-results/cucumber-report.json",
  "junit:test-results/cucumber-junit.xml",
  "rerun:test-results/rerun.txt",
];

const retry = process.env.CI ? parseInt(process.env.RETRY_COUNT || "2", 10) : 0;

module.exports = {
  // Local / default: no allure — avoids the Windows duplicate-instance PENDING race.
  default: {
    require: requires,
    format: baseFormat,
    retry,
  },
  // CI only: adds the allure formatter so test-suite.yml can build the report.
  ci: {
    require: requires,
    format: [...baseFormat, "allure-cucumberjs/reporter"],
    retry,
  },
};
