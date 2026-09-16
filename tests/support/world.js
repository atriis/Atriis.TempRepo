/**
 * Cucumber World
 *
 * Provides shared context for all step definitions.
 * Holds the Playwright browser and page instances.
 */

const { setWorldConstructor, World } = require("@cucumber/cucumber");
const { launchBrowser } = require("./browserFactory");
const sessionOptions = require("@utils/sessionOptions");

class CustomWorld extends World {
  constructor(options) {
    super(options);
    this.browser = null;
    this.context = null;
    this.page = null;
    // Every trip number touched during the scenario, first-seen order and
    // de-duplicated. Surfaced into the CI summary table by the After hook.
    this.tripIds = [];
    // What the share dialog's email preview was seen to contain during the scenario, so a
    // later step can prove the delivered mail carries the same thing. Written by the
    // share-preview verification steps, read by the received-email steps.
    this.emailPreviewExpectations = { texts: [], links: [] };
  }

  /**
   * Record a string confirmed present in the share email preview.
   * @param {...string} texts
   */
  recordEmailPreviewText(...texts) {
    for (const text of texts) {
      if (typeof text !== "string" || !text.trim()) continue;
      if (!this.emailPreviewExpectations.texts.includes(text)) {
        this.emailPreviewExpectations.texts.push(text);
      }
    }
  }

  /**
   * Record a link confirmed present in the share email preview.
   * @param {{text: string, href: string}} link
   */
  recordEmailPreviewLink(link) {
    if (!link || typeof link.text !== "string" || !link.text.trim()) return;
    if (this.emailPreviewExpectations.links.some((known) => known.text === link.text)) return;
    this.emailPreviewExpectations.links.push({ text: link.text, href: link.href ?? "" });
  }

  /**
   * Record a trip number encountered during the scenario. Kept de-duplicated
   * and order-preserving so a multi-trip scenario reports all of its trips.
   * @param {string|number|null|undefined} id
   */
  recordTripId(id) {
    if (id === null || id === undefined) return;
    const value = String(id).trim();
    if (!value) return;
    if (!this.tripIds.includes(value)) {
      this.tripIds.push(value);
    }
  }

  /**
   * The trip numbers this scenario is known to have touched, in the order a consumer should fall
   * back through them. Reading its own state is the World's job; deciding which one identifies a
   * given trip is the caller's (see Email.resolveItinerarySubjectHint).
   *
   * @returns {Array<string|number|undefined>} Preference order, sparse — entries may be undefined
   */
  getTripNumberCandidates() {
    const recorded = this.tripIds.filter(Boolean);
    return [
      this.tripId,
      this.currentTripId,
      this.createdTripId,
      // Mirrors how tests/support/hooks.js gathers trip ids for reporting; last seen wins.
      recorded.length ? recorded[recorded.length - 1] : undefined,
    ];
  }

  /**
   * Initialize Playwright browser and create a new page
   */
  async init() {
    this.browser = await launchBrowser();

    this.context = await this.browser.newContext({
      // Same per-scenario overrides App.createBrowserSession() applies, so a scenario that opens
      // its browser through the world rather than through a step still honours an @timezone tag.
      ...sessionOptions.get(),
      viewport: { width: 1920, height: 1080 },
      screen: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
      // Grant clipboard access so features that copy via navigator.clipboard.write
      // (e.g. the Share dialog "Copy to clipboard" action) resolve their success
      // state instead of silently rejecting. Additive — no effect on other tests.
      permissions: ["clipboard-read", "clipboard-write"],
    });

    // Start tracing so the After hook's tracing.stop() has something to flush.
    // A trace is recorded by the browser process and survives a hung/crashed
    // renderer, so it's the debugging artifact that works even when the
    // failure screenshot times out. Gated on CI to match the CI-only
    // tracing.stop() in the After hook — locally it would only ever be
    // recorded and discarded.
    //
    // Low fidelity on purpose: snapshots give the interactive DOM time-travel
    // that makes a trace worth keeping. screenshots (a rasterized image on
    // EVERY action) and sources are dropped — with 4 parallel Chromiums on the
    // 2-vCPU runner, per-action rasterization starved actionability waits and
    // caused random step timeouts. The per-scenario failure screenshot lives in
    // the After hook (this.page.screenshot), independent of the trace.
    if (process.env.CI) {
      await this.context.tracing.start({ screenshots: false, snapshots: true, sources: false });
    }

    this.page = await this.context.newPage();
  }

  /**
   * Close browser and cleanup
   */
  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

setWorldConstructor(CustomWorld);
