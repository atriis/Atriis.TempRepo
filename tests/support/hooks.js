/**
 * Register module aliases FIRST before any requires
 */
require("module-alias/register");

/**
 * Cucumber Hooks
 */

const { Before, After, setDefaultTimeout, Status } = require("@cucumber/cucumber");
const path = require("path");
const fs = require("fs");
const { launchBrowser } = require("./browserFactory");
const config = require("../../src/config/config");
const sessionOptions = require("@utils/sessionOptions");
const logger = require("@utils/logger").child("Hooks");

setDefaultTimeout(120000);

/**
 * Before each scenario
 */
Before(async function (testCase) {
  this.scenarioTags = (testCase.pickle?.tags || []).map((tag) => tag.name);

  // Reset FIRST, unconditionally: a worker runs its scenarios serially in one process, so without
  // this an @timezone-tagged scenario would leak its zone into every later scenario in the same
  // worker. Untagged scenarios must always get Playwright's default (the runner's own zone).
  sessionOptions.reset();

  // @timezone:<IANA zone> — e.g. @timezone:America/New_York — opens the browser context in that
  // zone, which is how a "change your computer's time zone" manual step is automated. It moves
  // only the BROWSER clock (Date, getTimezoneOffset, Intl); server-rendered timestamps are
  // unaffected, so it suits tests about client-side date rendering and nothing else.
  const timezoneTag = this.scenarioTags.find((tag) => tag.startsWith("@timezone:"));
  if (timezoneTag) {
    const timezoneId = timezoneTag.slice("@timezone:".length);
    if (!timezoneId) {
      throw new Error(
        `Scenario "${testCase.pickle.name}" has a bare @timezone: tag. ` +
        'Give it an IANA zone, e.g. @timezone:America/New_York'
      );
    }

    // Fail here rather than in newContext(): Playwright rejects an unknown zone with an opaque
    // browser-level error at session launch, which reads as an infra failure, not a typo in a tag.
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezoneId });
    } catch {
      throw new Error(
        `Scenario "${testCase.pickle.name}" carries ${timezoneTag}, but "${timezoneId}" is not a ` +
        'recognised IANA time zone. Use e.g. America/New_York, Europe/Lisbon, Asia/Tokyo.'
      );
    }

    sessionOptions.set({ timezoneId });
    this.timezoneId = timezoneId;
    logger.info("Scenario requests an overridden browser timezone", { timezoneId });
  }

  // No scenario may rely on this hook for its browser: the step itself launches it and assigns
  // this.page, so the After hook can screenshot even when the sign-in is what failed. Every step
  // listed here calls App.createBrowserSession() — negative-auth scenarios legitimately never
  // reach an authenticated session, so the happy-path phrase alone cannot be the gate.
  const SESSION_OPENING_STEPS = [
    'I am logged in as "',
    'I attempt to log in with invalid credentials as "',
    'I log in triggering two-factor authentication as "',
  ];

  const opensBrowserSession = testCase.pickle.steps.some(step =>
    SESSION_OPENING_STEPS.some(phrase => step.text.includes(phrase))
  );

  if (!opensBrowserSession) {
    throw new Error(
      `Scenario "${testCase.pickle.name}" has no step that opens a browser session.\n` +
      'Most scenarios must start with: Given I am logged in as "email@domain.com"\n' +
      `Scenarios that never authenticate must start with one of: ${SESSION_OPENING_STEPS.slice(1)
        .map(phrase => `"${phrase}..."`)
        .join(', ')}`
    );
  }

  logger.debug("Before hook complete — login handled by step definition");
});

/**
 * After each scenario
 * 
 * - Saves a final screenshot to disk for every scenario
 * - Attaches screenshots to Cucumber report
 * - Records failures for retry in CI environments
 */
After(async function (scenario) {
  if (!this.page) {
    return; // No page to capture
  }

  // Shared naming for screenshot + trace artifacts so they line up per scenario.
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const featureFile = path.basename(scenario.pickle.uri || "", ".feature");
  const workItemMatch = featureFile.match(/^(\d+)_/);
  const workItemPrefix = workItemMatch ? `${workItemMatch[1]}_` : "";
  const scenarioName = scenario.pickle.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .substring(0, 50);
  const scenarioStatus = String(scenario.result?.status || "unknown").toLowerCase();
  const attemptNumber = (scenario.attempt ?? 0) + 1;
  const artifactBase = `${workItemPrefix}${scenarioName}_attempt${attemptNumber}`;
  const failed = scenario.result?.status === Status.FAILED;

  // Surface every trip number this scenario touched into the Cucumber report so
  // the CI summary table can show a "Trip #" column. Sources, deduped: ids
  // recorded during steps (this.tripIds), well-known world fields, and a live
  // scan of every open tab URL — the last one catches multi-trip / multi-tab
  // scenarios where a second trip was opened but never stored on the world.
  // Gather BEFORE closing the context below, or the page URLs are gone.
  try {
    const tripIds = new Set(Array.isArray(this.tripIds) ? this.tripIds.map(String) : []);
    for (const id of [this.tripId, this.currentTripId, this.createdTripId, this.storedConflictingTripId]) {
      if (id !== null && id !== undefined && String(id).trim()) tripIds.add(String(id).trim());
    }
    const pages = this.context ? this.context.pages() : this.page ? [this.page] : [];
    for (const p of pages) {
      try {
        const match = String(p.url() || "").match(/\/trips\/(\d+)(?:[/?#]|$)/i);
        if (match) tripIds.add(match[1]);
      } catch {
        // Page may already be closed — skip it.
      }
    }
    if (tripIds.size > 0) {
      this.attach("TRIP_IDS:" + [...tripIds].join(","), "text/plain");
    }
  } catch (error) {
    logger.warn("Failed to attach trip ids to report", { error: error.message });
  }

  try {
    // Viewport-only (not fullPage): fullPage forces a resize-to-full-height
    // rasterization that stalls past the 30s default in headless CI, especially
    // on tall results pages or when the scenario failed mid-load. animations:
    // "disabled" cancels running spinners so the capture can settle; the short
    // timeout fails fast instead of blocking teardown for 30s.
    const screenshot = await this.page.screenshot({
      animations: "disabled",
      timeout: 10000,
    });
    const screenshotsDir = path.join("test-results", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const filepath = path.join(screenshotsDir, `${artifactBase}_${scenarioStatus}_${timestamp}.png`);

    fs.writeFileSync(filepath, screenshot);
    logger.info("Scenario screenshot saved to disk", {
      file: filepath,
      scenario: scenario.pickle.name,
      status: scenario.result?.status,
    });

    this.attach(screenshot, "image/png");

    if (failed) {
      logger.warn("Test failed - screenshot captured", { scenario: scenario.pickle.name });
    }
  } catch (error) {
    logger.error("Failed to capture screenshot", { error: error.message });
  }

  // In CI, export the Playwright trace for failed scenarios. Open with
  // `npx playwright show-trace <file>` to replay every step and see where it hung.
  if (this.context && process.env.CI && failed) {
    try {
      const tracesDir = path.join("test-results", "traces");
      if (!fs.existsSync(tracesDir)) {
        fs.mkdirSync(tracesDir, { recursive: true });
      }
      const tracePath = path.join(tracesDir, `${artifactBase}_${timestamp}.zip`);
      await this.context.tracing.stop({ path: tracePath });
      logger.info("Failure trace saved to disk", { file: tracePath });
    } catch (error) {
      logger.error("Failed to save trace", { error: error.message });
    }
  }

  // Close context and browser
  if (this.context) {
    await this.context.close();
  }
  if (this.browser) {
    await this.browser.close();
  }
});
