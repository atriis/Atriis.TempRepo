/**
 * Network Interceptor
 *
 * Single source of truth for all Playwright network interception and API response
 * capture across the test suite. It is intentionally PRODUCT-AGNOSTIC: it holds no
 * knowledge of Flights, Hotels, Rail, Cars, Packages or any specific endpoint. Products
 * describe WHAT they want to capture via a declarative rule; this module owns HOW the
 * capture is performed (matching, waiting, body reading, timeouts).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MATCHING RULE
 * A rule is a plain object; every provided field must match (logical AND). All fields
 * are optional — an empty rule matches every request/response.
 *
 *   {
 *     urlIncludes:      string | string[]  // substring(s) that must appear in the URL
 *     pathnameEndsWith: string             // URL pathname must end with this
 *     urlMatches:       RegExp             // full URL must match this regex
 *     method:           string             // HTTP method (case-insensitive), e.g. 'POST'
 *     resourceType:     string             // Playwright resource type, e.g. 'xhr', 'fetch'
 *     caseInsensitive:  boolean            // lower-case URL comparisons (urlIncludes/pathnameEndsWith)
 *     predicate:        (target) => boolean | Promise<boolean>  // custom check (may read the body)
 *   }
 *
 * The predicate runs LAST, only after the cheap URL/method/resourceType checks pass, so
 * response bodies are never read for non-matching traffic. A predicate that throws is
 * treated as "no match" (the wait keeps going) — mirroring the legacy hand-rolled waits.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE (arm before the action, await after):
 *
 *   const { getNetworkInterceptor, readJson } = require("@utils/networkInterceptor");
 *   const responsePromise = getNetworkInterceptor(page).waitForResponse({ urlIncludes: '/api/v3/quotes', method: 'GET' });
 *   await doTheThingThatTriggersTheCall();
 *   const body = await readJson(responsePromise);
 *
 * Parallel safety: state is per-page. `getNetworkInterceptor` caches one instance per
 * Playwright page (WeakMap), and each wait holds no shared state, so concurrent tests
 * running on separate pages never interfere.
 */

// Matches the timeout previously hard-coded across the per-product capture helpers.
const DEFAULT_TIMEOUT = 120000;

/** True for a Playwright Response (has status()); false for a Request. */
function isResponse(target) {
  return typeof target.status === 'function';
}

/** HTTP method for either a Response or a Request. */
function getMethod(target) {
  return isResponse(target) ? target.request().method() : target.method();
}

/** Resource type for either a Response or a Request (undefined if unavailable). */
function getResourceType(target) {
  if (isResponse(target)) {
    const req = target.request();
    return typeof req.resourceType === 'function' ? req.resourceType() : undefined;
  }
  return typeof target.resourceType === 'function' ? target.resourceType() : undefined;
}

/** Applies the URL-based portions of a rule. */
function urlMatches(url, rule) {
  const cmp = (value) => (rule.caseInsensitive ? String(value).toLowerCase() : String(value));
  const haystack = cmp(url);

  if (rule.urlIncludes != null) {
    const needles = Array.isArray(rule.urlIncludes) ? rule.urlIncludes : [rule.urlIncludes];
    if (!needles.every((needle) => haystack.includes(cmp(needle)))) return false;
  }

  if (rule.pathnameEndsWith != null) {
    let pathname;
    try {
      pathname = new URL(url).pathname;
    } catch {
      return false;
    }
    if (!cmp(pathname).endsWith(cmp(rule.pathnameEndsWith))) return false;
  }

  if (rule.urlMatches instanceof RegExp && !rule.urlMatches.test(url)) return false;

  return true;
}

/**
 * Compiles a declarative rule into an async predicate for Playwright's
 * waitForResponse/waitForRequest.
 *
 * @param {object} rule - See the module docblock for the supported fields.
 * @returns {(target: import('@playwright/test').Response|import('@playwright/test').Request) => Promise<boolean>}
 */
function buildMatcher(rule) {
  if (!rule || typeof rule !== 'object') {
    throw new Error('[networkInterceptor] a matching rule object is required');
  }

  return async (target) => {
    if (!urlMatches(target.url(), rule)) return false;
    if (rule.method && getMethod(target).toUpperCase() !== String(rule.method).toUpperCase()) return false;
    if (rule.resourceType && getResourceType(target) !== rule.resourceType) return false;

    if (typeof rule.predicate === 'function') {
      try {
        return Boolean(await rule.predicate(target));
      } catch {
        return false;
      }
    }
    return true;
  };
}

/**
 * Awaits a captured response (or a promise of one) and returns its parsed JSON body.
 * Consistent body-reading entry point for every product.
 *
 * @param {import('@playwright/test').Response|Promise<import('@playwright/test').Response>} responseOrPromise
 * @returns {Promise<any>}
 */
async function readJson(responseOrPromise) {
  const response = await responseOrPromise;
  if (!response) throw new Error('[networkInterceptor.readJson] no response was captured');
  return response.json();
}

class NetworkInterceptor {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    if (!page) throw new Error('[networkInterceptor] a Playwright page is required');
    this.page = page;
  }

  /**
   * Arms a one-shot wait for the next RESPONSE matching the rule. Call BEFORE the
   * action that triggers the request, then await the returned promise afterwards.
   *
   * @param {object} rule
   * @param {{timeout?: number}} [options]
   * @returns {Promise<import('@playwright/test').Response>}
   */
  waitForResponse(rule, { timeout = DEFAULT_TIMEOUT } = {}) {
    const matcher = buildMatcher(rule);
    return this.page.waitForResponse((response) => matcher(response), { timeout });
  }

  /**
   * Arms a one-shot wait for the next REQUEST matching the rule.
   *
   * @param {object} rule
   * @param {{timeout?: number}} [options]
   * @returns {Promise<import('@playwright/test').Request>}
   */
  waitForRequest(rule, { timeout = DEFAULT_TIMEOUT } = {}) {
    const matcher = buildMatcher(rule);
    return this.page.waitForRequest((request) => matcher(request), { timeout });
  }
}

// One NetworkInterceptor per page (mirrors pageObjectCache); WeakMap auto-cleans on GC.
const interceptorCache = new WeakMap();

/**
 * Returns the cached NetworkInterceptor for a page, creating it on first use.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {NetworkInterceptor}
 */
function getNetworkInterceptor(page) {
  if (!page) throw new Error('[networkInterceptor] page is required for getNetworkInterceptor');
  let instance = interceptorCache.get(page);
  if (!instance) {
    instance = new NetworkInterceptor(page);
    interceptorCache.set(page, instance);
  }
  return instance;
}

module.exports = {
  NetworkInterceptor,
  getNetworkInterceptor,
  readJson,
};
