/**
 * Test Mailbox Reader (Mailsac)
 *
 * Reads the emails the application actually sends (share quote, share itinerary) so a test can
 * assert on delivered mail rather than only on the in-app preview.
 *
 * Why this exists:
 * - The share dialog preview shows the same backend-generated HTML the mail server sends, so
 *   most email assertions can be made against the preview. What the preview cannot prove is
 *   that the mail was addressed, rendered and delivered — that needs a real inbox.
 * - Testim provided a hosted "generate email address" + "email validation" pair. This is the
 *   replacement: an address the test owns, and a poll for the message that lands in it.
 *
 * Design notes:
 * - Mailsac only, deliberately. An earlier version was provider-pluggable; with one account and
 *   one API key that abstraction was indirection over a single implementation, so it is gone.
 *   Swapping provider means rewriting the three fetch calls below, which is less code than the
 *   seam that avoided it.
 * - No npm dependency: everything goes through global fetch (Node 18+, and package.json already
 *   requires >=18), so enabling this is env configuration only.
 * - Nothing here is enabled by default. With no MAILBOX_API_KEY, generateAddress() and
 *   waitForEmail() throw a configuration error. They never quietly succeed, because an email
 *   assertion that silently skips is worse than no assertion.
 *
 * API reference: https://docs.mailsac.com/en/latest/api_examples/getting_started/getting_started.html
 */

const config = require("@config/config");
const { extractHtmlLinks, normalizeHtmlText } = require("@utils/dom");
const logger = require("./logger").child("Mailbox");

const BASE_URL = "https://mailsac.com/api";
const DEFAULT_DOMAIN = "mailsac.com";

function headers() {
  return { "Mailsac-Key": config.mailbox.apiKey };
}

/**
 * Turns a fetch Response into a helpful error, including the response body: Mailsac puts the
 * reason (bad key, quota exhausted, rate limit) in the body, not the status text.
 *
 * @param {string} label - What was being attempted
 * @param {Response} response
 * @returns {Promise<Error>}
 */
async function httpError(label, response) {
  const body = await response.text().catch(() => "");
  const detail = body.trim().slice(0, 500);
  return new Error(
    `[mailbox] ${label} failed: HTTP ${response.status} ${response.statusText}` +
      (detail ? ` — ${detail}` : "")
  );
}

/**
 * Whether delivered mail can be read in this environment.
 *
 * Steps that only need to *send* mail should not depend on this; steps that read mail should let
 * assertConfigured() throw rather than skipping.
 *
 * @returns {boolean}
 */
function isConfigured() {
  return Boolean(config.mailbox.apiKey);
}

/**
 * Throws the one error message that explains how to switch mail reading on.
 */
function assertConfigured() {
  if (!isConfigured()) {
    throw new Error(
      "[mailbox] Reading delivered email needs a Mailsac API key. Set MAILBOX_API_KEY in .env " +
        "(dashboard -> API Keys & Users; the key is shown once). See .env.example."
    );
  }
}

/**
 * Builds a unique address in the Mailsac account, so each run reads only its own mail.
 *
 * Mailsac inboxes exist implicitly — nothing has to be created up front.
 *
 * @param {string} [tag] - Short label folded into the local part, e.g. a test id
 * @returns {string} An address the configured account receives
 */
function generateAddress(tag = "test") {
  assertConfigured();

  const slug =
    String(tag)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "test";
  const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
  const domain = config.mailbox.domain || DEFAULT_DOMAIN;

  return `atriis.qa.${slug}.${unique}@${domain}`;
}

/**
 * Normalises a fetched message into the shape the DSL asserts against.
 *
 * @param {object} raw
 * @param {string} raw.id
 * @param {string} [raw.subject]
 * @param {string} [raw.from]
 * @param {string} [raw.to]
 * @param {string} [raw.html] - Raw HTML body ("" when the mail is text-only)
 * @param {string} [raw.text] - Plain text body
 * @returns {{id: string, subject: string, from: string, to: string, html: string, text: string, body: string, links: Array<{text: string, href: string}>}}
 */
function toMessage(raw) {
  const html = raw.html ?? "";
  const text = raw.text ?? "";

  // Assertions read `body`: the HTML stripped to text when there is HTML, the plain part
  // otherwise. Email templates put content the plain-text part omits (table cells, image alt
  // text) only in the HTML, so the HTML is the fuller source.
  const fromHtml = normalizeHtmlText(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  );

  return {
    id: raw.id,
    subject: raw.subject ?? "",
    from: raw.from ?? "",
    to: raw.to ?? "",
    html,
    text,
    body: fromHtml || normalizeHtmlText(text),
    links: extractHtmlLinks(html),
  };
}

/**
 * Lists the messages currently in an address's inbox.
 *
 * @param {string} to
 * @param {Date} [receivedAfter] - Drops anything older, so a re-run cannot match a previous
 *   run's email
 * @returns {Promise<Array<{id: string, subject: string, received: string}>>}
 */
async function listMessages(to, receivedAfter) {
  const response = await fetch(`${BASE_URL}/addresses/${encodeURIComponent(to)}/messages`, {
    headers: headers(),
  });
  if (!response.ok) {
    throw await httpError(`listing messages for "${to}"`, response);
  }

  const messages = await response.json();

  return (messages ?? [])
    .map((item) => ({
      id: item._id,
      subject: item.subject ?? "",
      received: item.received ?? item.created,
    }))
    .filter((item) => {
      if (!receivedAfter) return true;
      const received = Date.parse(item.received);
      // Keep undated messages: dropping one would be worse than carrying an extra candidate,
      // and the subject filter still applies.
      return Number.isNaN(received) || received >= receivedAfter.getTime();
    });
}

/**
 * Fetches one message's bodies.
 *
 * Mailsac serves bodies as text, not JSON: /dirty keeps the HTML intact, /text is the plaintext
 * rendering. Both are fetched so assertions can use either.
 *
 * @param {string} id
 * @param {string} to
 * @param {string} subject - Carried over from the listing; the body endpoints do not return it
 * @returns {Promise<object>} A message in toMessage() shape
 */
async function fetchMessage(id, to, subject) {
  const address = encodeURIComponent(to);
  const messageId = encodeURIComponent(id);

  const [htmlResponse, textResponse] = await Promise.all([
    fetch(`${BASE_URL}/dirty/${address}/${messageId}`, { headers: headers() }),
    fetch(`${BASE_URL}/text/${address}/${messageId}`, { headers: headers() }),
  ]);

  if (!htmlResponse.ok) {
    throw await httpError(`fetching message ${id} (html)`, htmlResponse);
  }
  if (!textResponse.ok) {
    throw await httpError(`fetching message ${id} (text)`, textResponse);
  }

  return toMessage({
    id,
    to,
    subject,
    from: "",
    html: await htmlResponse.text(),
    text: await textResponse.text(),
  });
}

/**
 * Polls the inbox until a matching message arrives, then returns it fully fetched.
 *
 * Each poll is one metered API call, so pollIntervalMs is the lever for cost on a metered plan.
 *
 * @param {object} options
 * @param {string} options.to - The address the mail was sent to
 * @param {string} [options.subjectContains] - Narrows to a subject substring (case-insensitive)
 * @param {Date} [options.receivedAfter] - Ignores mail that predates this, so a re-run of the
 *   same scenario cannot pass on the previous run's email
 * @param {number} [options.timeoutMs]
 * @param {number} [options.pollIntervalMs]
 * @returns {Promise<{id: string, subject: string, from: string, to: string, html: string, text: string, body: string, links: Array<{text: string, href: string}>}>}
 */
async function waitForEmail({
  to,
  subjectContains,
  receivedAfter,
  timeoutMs = config.mailbox.timeoutMs,
  pollIntervalMs = config.mailbox.pollIntervalMs,
} = {}) {
  assertConfigured();

  if (typeof to !== "string" || !to.trim()) {
    throw new Error(`[mailbox] waitForEmail needs the recipient address, got: ${to}`);
  }

  const wantedSubject = subjectContains ? subjectContains.toLowerCase() : null;
  const deadline = Date.now() + timeoutMs;

  logger.info("Waiting for an email to arrive", {
    to,
    subjectContains: subjectContains ?? null,
    timeoutMs,
  });

  let attempts = 0;
  let lastError = null;
  let seenSubjects = [];

  while (Date.now() < deadline) {
    attempts += 1;
    try {
      const candidates = await listMessages(to, receivedAfter);
      seenSubjects = candidates.map((candidate) => candidate.subject);

      const hit = candidates.find(
        (candidate) => !wantedSubject || (candidate.subject ?? "").toLowerCase().includes(wantedSubject)
      );

      if (hit) {
        logger.info("Email arrived", { to, subject: hit.subject, attempts });
        return await fetchMessage(hit.id, to, hit.subject);
      }
    } catch (err) {
      // A single failed poll is not a failed wait: the API rate-limits and blips. Keep the error
      // so the timeout can report it instead of a bare "no mail".
      lastError = err;
      logger.warn("Mailbox poll failed, retrying", { attempt: attempts, error: err.message });
    }

    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await new Promise((resolve) => setTimeout(resolve, Math.min(pollIntervalMs, remaining)));
  }

  throw new Error(
    `[mailbox] No email to "${to}"` +
      (subjectContains ? ` with a subject containing "${subjectContains}"` : "") +
      ` arrived within ${timeoutMs}ms (${attempts} polls).` +
      (seenSubjects.length ? ` Subjects seen for this address: ${JSON.stringify(seenSubjects)}.` : "") +
      (lastError ? ` Last poll error: ${lastError.message}` : "")
  );
}

module.exports = {
  isConfigured,
  assertConfigured,
  generateAddress,
  waitForEmail,
  // Exported for tests of this helper only.
  toMessage,
};
