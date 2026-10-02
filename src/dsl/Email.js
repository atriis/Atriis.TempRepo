/**
 * Email DSL
 *
 * Assertions against the mail the application actually sends — share quote, share itinerary, trip
 * and approval request emails. Sits on top of @utils/mailbox, which owns the provider REST calls.
 *
 * Division of labour with the Cart DSL:
 * - Cart owns the share dialog: adding a recipient, sending, and asserting the *preview*.
 * - Email owns what came out the other end: waiting for the message and asserting its content.
 *
 * The preview and the delivered mail are rendered from the same backend template, so a scenario
 * usually asserts content on the preview (fast, no external dependency) and then uses these
 * methods to prove the same content survived delivery.
 */

const mailbox = require("@utils/mailbox");
const config = require("@config/config");
const { getPageObject } = require("@utils/pageObjectCache");
const { CommonPage } = require("@pages/CommonPage");
const logger = require("@utils/logger").child("Email-DSL");

const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

// How the app titles a share-quotes email: "Share quotes for <traveller> <dates>".
const SHARE_QUOTES_SUBJECT = "Share quotes for";

// Approve / Decline links in an approval request email point at the anonymous approval-by-email
// route (router `/tripApproval/:approvalType`). "approve" approves on load; "approvewithconfirmation"
// (corporate setting "Enable approval confirmation on pop-up") shows a checkbox first. The decline
// variants are "decline" / "declinereason", which the accept pattern must never match.
const APPROVAL_LINK_PATTERN = /\/tripApproval\//i;
const APPROVAL_ACCEPT_LINK_PATTERN = /\/tripApproval\/(approve|approvewithconfirmation)(?=[?#/]|$)/i;

/**
 * De-duplicates and validates the trip numbers a mail is matched against.
 *
 * Throws when there are none: a reserved MAILBOX_ADDRESS is shared by every scenario, so a mail
 * read without a trip number to check could be a parallel run's.
 *
 * @param {Array<string|number|null|undefined>} candidates
 * @param {string} caller - Method name for the error
 * @returns {string[]}
 */
function requireTripNumbers(candidates, caller) {
  const tripNumbers = [
    ...new Set(
      (candidates ?? [])
        .filter((candidate) => candidate !== null && candidate !== undefined)
        .map((candidate) => String(candidate).trim())
        .filter(Boolean)
    ),
  ];
  if (tripNumbers.length === 0) {
    throw new Error(
      `[Email.${caller}] No trip number was recorded for this scenario, so the mail cannot ` +
        "be told apart from another run's in the shared inbox. Record it with this.recordTripId."
    );
  }
  return tripNumbers;
}

const Email = {
  /**
   * Whether delivered mail can be read in this environment.
   *
   * Exposed so a caller can *report* the gap, never to skip an assertion quietly: the steps that
   * read mail let @utils/mailbox throw its configuration error instead of calling this.
   *
   * @returns {boolean}
   */
  isMailboxConfigured() {
    return mailbox.isConfigured();
  },

  /**
   * Builds a recipient address for a share email.
   *
   * Returns a mailbox-backed address when a test mailbox is configured, so the message can be
   * read back. With no mailbox configured it falls back to a throwaway address on
   * config.shareRecipientEmailDomain: the share still exercises the recipient picker and the
   * send, and only the read-back is unavailable.
   *
   * @param {string} [tag] - Short label folded into the local part, e.g. a test id
   * @returns {{email: string, readable: boolean}} The address, and whether it can be read back
   */
  generateRecipientAddress(tag = "itinerary") {
    if (mailbox.isConfigured()) {
      return { email: mailbox.generateAddress(tag), readable: true };
    }

    const slug =
      String(tag)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "itinerary";
    const unique = `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

    return {
      email: `atriis.qa.${slug}.${unique}@${config.shareRecipientEmailDomain}`,
      readable: false,
    };
  },

  /**
   * The subject substring a share-ITINERARY mailbox read is narrowed to.
   *
   * What tells this run's mail apart from another's. With a per-scenario generated address the
   * inbox itself was the discriminator, so no subject filter was needed. A reserved
   * MAILBOX_ADDRESS is shared by every scenario and by every parallel worker, so the address no
   * longer discriminates and something else must: two scenarios sending within the same window
   * would otherwise each match the other's message.
   *
   * The trip number does the job. The app titles these "Travel plan for <traveller> trip <id> …",
   * and while the share dialog's Language selector localises the wording, a bare number survives
   * it — which is exactly why the number is matched and not the phrasing.
   *
   * The open page's URL wins over the caller's candidates: the share dialog is opened on the trip
   * being shared, so that is the trip, not merely a trip the scenario touched.
   *
   * Throws rather than reading an unfiltered shared inbox: matching another scenario's mail is a
   * pass for the wrong reason, which is worse than the failure this raises.
   *
   * @param {import('@playwright/test').Page} page
   * @param {object} [options]
   * @param {Array<string|number>} [options.tripNumberCandidates] - Fallbacks in preference order,
   *   for when the page is no longer on the trip route (e.g. trip numbers the scenario recorded)
   * @returns {Promise<string|undefined>} The substring, or undefined when no filter is needed
   */
  async resolveItinerarySubjectHint(page, { tripNumberCandidates = [] } = {}) {
    const commonPage = getPageObject(page, CommonPage);
    const fromUrl = commonPage.getTripNumberFromUrl();
    if (fromUrl) return fromUrl;

    for (const candidate of tripNumberCandidates) {
      if (candidate === null || candidate === undefined) continue;
      const value = String(candidate).trim();
      if (value) return value;
    }

    if (config.mailbox.address) {
      throw new Error(
        "[Email.resolveItinerarySubjectHint] Could not work out which trip was shared, and " +
          "MAILBOX_ADDRESS is a single inbox shared by every scenario — reading it unfiltered " +
          "could match another run's mail. Record the trip number on the world " +
          "(this.recordTripId) before sharing, or open the trip page so its URL carries the number."
      );
    }

    // Per-scenario generated address: the inbox is already this run's, so no filter is needed.
    return undefined;
  },

  /**
   * The subject substring a share-QUOTES mailbox read is narrowed to.
   *
   * Share quotes mail is a different template from share itinerary mail, and the trip number
   * resolveItinerarySubjectHint relies on is not in its subject: the app titles it
   * "Share quotes for <traveller> <dates>". So this run is identified by the traveller instead.
   *
   * Throws for the same reason resolveItinerarySubjectHint does: on a reserved MAILBOX_ADDRESS,
   * "Share quotes for" alone would happily match a parallel run's message.
   *
   * No page argument: unlike the itinerary hint there is nothing to read off the page, and the
   * traveller is something the scenario knows rather than something the mail route reveals.
   *
   * @param {object} [options]
   * @param {string} [options.traveller] - The traveller the quotes were shared for
   * @returns {string} The substring
   */
  resolveShareQuotesSubjectHint({ traveller } = {}) {
    const name = (traveller ?? "").trim();
    if (name) return `${SHARE_QUOTES_SUBJECT} ${name}`;

    if (config.mailbox.address) {
      throw new Error(
        "[Email.resolveShareQuotesSubjectHint] Could not work out whose quotes were shared, and " +
          'MAILBOX_ADDRESS is a single inbox shared by every scenario — matching on "Share quotes ' +
          'for" alone could read another run\'s mail. Add "I have added a random guest traveler" ' +
          "(which records the name) before sharing, or pass the traveller explicitly."
      );
    }

    // Per-scenario generated address: the inbox is already this run's, so the prefix is enough.
    return SHARE_QUOTES_SUBJECT;
  },

  /**
   * Waits for a share email to land in the test mailbox.
   *
   * @param {object} options
   * @param {string} options.to - The address the share was sent to
   * @param {string} [options.subjectContains] - Narrows to a subject substring
   * @param {Date} [options.sentAfter] - Ignores mail older than this, so a re-run cannot pass on
   *   a previous run's message
   * @returns {Promise<{id: string, subject: string, from: string, to: string, html: string, text: string, body: string, links: Array<{text: string, href: string}>}>}
   */
  async waitForSharedEmail({ to, subjectContains, sentAfter } = {}) {
    if (typeof to !== "string" || !to.trim()) {
      throw new Error(
        `[Email.waitForSharedEmail] "to" must be the address the share was sent to, got: ${to}`
      );
    }

    const message = await mailbox.waitForEmail({ to, subjectContains, receivedAfter: sentAfter });

    logger.info("[Email.waitForSharedEmail] Received the share email", {
      to,
      subject: message.subject,
      bodyLength: message.body.length,
      linkCount: message.links.length,
    });

    return message;
  },

  /**
   * Resolves the subject to filter on, then waits for that share email — the whole read-back in
   * one call, so a caller does not have to know that a hint is chosen before the wait.
   *
   * The explicit subjectContains wins when given; otherwise the itinerary hint is resolved from
   * the page and the caller's trip numbers. Pass the share-quotes hint in explicitly
   * (resolveShareQuotesSubjectHint), since only the caller knows which template was sent.
   *
   * @param {import('@playwright/test').Page} page
   * @param {object} options
   * @param {string} options.to - The address the share was sent to
   * @param {string} [options.subjectContains] - Overrides the resolved itinerary hint
   * @param {Array<string|number>} [options.tripNumberCandidates] - Fallbacks for the itinerary hint
   * @param {Date} [options.sentAfter] - Ignores mail older than this
   * @returns {Promise<object>} The received message
   */
  async receiveShareEmail(page, { to, subjectContains, tripNumberCandidates = [], sentAfter } = {}) {
    const hint =
      subjectContains ?? (await this.resolveItinerarySubjectHint(page, { tripNumberCandidates }));

    return this.waitForSharedEmail({ to, subjectContains: hint, sentAfter });
  },

  /**
   * Waits for a mail the application sends ON ITS OWN after a trip event — e.g. the
   * "E-ticket confirmation for" mail sent after ticketing — and proves it belongs to this trip.
   *
   * Unlike a share, there is no recipient field to point at a generated address: the app sends it
   * to the traveller's profile email, so `to` is the fixed inbox that profile was set up with.
   * The subject is matched by its template prefix only, because the rest of it is the traveller
   * and route, so the trip number is checked in the delivered subject or body instead. A mail for
   * another trip throws: matching a parallel run's message would be a pass for the wrong reason.
   *
   * @param {object} options
   * @param {string} options.to - The traveller's profile email (a reserved test inbox)
   * @param {string} options.subjectContains - The template's subject prefix
   * @param {Array<string|number>} options.tripNumberCandidates - This scenario's trip numbers
   * @param {Date} [options.sentAfter] - Ignores mail older than this, so a re-run cannot pass on
   *   a previous run's message
   * @param {number} [options.timeoutMs] - Mail sent after ticketing lands later than a share
   * @returns {Promise<object>} The received message
   */
  async waitForTripEmail({ to, subjectContains, tripNumberCandidates = [], sentAfter, timeoutMs } = {}) {
    if (typeof to !== "string" || !to.trim()) {
      throw new Error(`[Email.waitForTripEmail] "to" must be the traveller's inbox address, got: ${to}`);
    }
    if (typeof subjectContains !== "string" || !subjectContains.trim()) {
      throw new Error(
        `[Email.waitForTripEmail] "subjectContains" must be the mail's subject prefix, got: ${subjectContains}`
      );
    }

    const tripNumbers = requireTripNumbers(tripNumberCandidates, "waitForTripEmail");

    const message = await mailbox.waitForEmail({ to, subjectContains, receivedAfter: sentAfter, timeoutMs });

    const searchable = `${message.subject} ${message.body}`;
    if (!tripNumbers.some((tripNumber) => searchable.includes(tripNumber))) {
      throw new Error(
        `[Email.waitForTripEmail] The "${subjectContains}" email received at "${to}" is not for this ` +
          `trip: none of ${JSON.stringify(tripNumbers)} appears in it.\n` +
          `Subject was: "${message.subject}"`
      );
    }

    logger.info("[Email.waitForTripEmail] Received the trip email", {
      to,
      subject: message.subject,
      bodyLength: message.body.length,
    });

    return message;
  },

  /**
   * Waits for the approval request email for this trip ("We would like your approval").
   *
   * The mail goes to the APPROVER's profile email, so `to` is the reserved inbox that approver was
   * set up with, not an address the test chooses. It is found by CONTENT rather than subject: the
   * subject comes from a backend template localised per approver, whereas every approval request
   * carries links to the `/tripApproval/` route and names the trip number. A message that is not
   * this trip's approval request is skipped and left in the inbox for whoever it belongs to.
   *
   * @param {object} options
   * @param {string} options.to - The approver's inbox
   * @param {Array<string|number>} options.tripNumberCandidates - This scenario's trip numbers
   * @param {Date} [options.sentAfter] - Ignores mail older than this
   * @param {number} [options.timeoutMs]
   * @returns {Promise<object>} The received message
   */
  async waitForApprovalRequestEmail({ to, tripNumberCandidates = [], sentAfter, timeoutMs } = {}) {
    if (typeof to !== "string" || !to.trim()) {
      throw new Error(`[Email.waitForApprovalRequestEmail] "to" must be the approver's inbox address, got: ${to}`);
    }
    const tripNumbers = requireTripNumbers(tripNumberCandidates, "waitForApprovalRequestEmail");

    const message = await mailbox.waitForEmail({
      to,
      receivedAfter: sentAfter,
      timeoutMs,
      matches: (candidate) =>
        candidate.links.some((link) => APPROVAL_LINK_PATTERN.test(link.href)) &&
        tripNumbers.some((tripNumber) => `${candidate.subject} ${candidate.body}`.includes(tripNumber)),
    });

    logger.info("[Email.waitForApprovalRequestEmail] Received the approval request email", {
      to,
      subject: message.subject,
      approvalLinks: message.links.filter((link) => APPROVAL_LINK_PATTERN.test(link.href)).map((link) => link.text),
    });

    return message;
  },

  /**
   * Returns the accept (approve) link of an approval request email.
   *
   * Matched on the href, not on the label or position: the label is translated, and following a
   * decline link by mistake would silently decline the trip.
   *
   * @param {object} message - A message from waitForApprovalRequestEmail
   * @returns {{text: string, href: string}}
   */
  getApprovalAcceptLink(message) {
    if (!message || !Array.isArray(message.links)) {
      throw new Error('[Email.getApprovalAcceptLink] "message" must come from waitForApprovalRequestEmail.');
    }

    const accept = message.links.find((link) => APPROVAL_ACCEPT_LINK_PATTERN.test(link.href));
    if (!accept) {
      throw new Error(
        `[Email.getApprovalAcceptLink] The approval request email (subject "${message.subject}") has no ` +
          "accept link to /tripApproval/approve or /tripApproval/approvewithconfirmation.\n" +
          `Approval links found: ${JSON.stringify(
            message.links.filter((link) => APPROVAL_LINK_PATTERN.test(link.href))
          )}`
      );
    }
    return accept;
  },

  /**
   * Verifies none of the given strings appears in a received email's body.
   *
   * Same normalisation as verifyEmailContainsTexts, so "Additional charges" split across table
   * cells or cased differently is still caught.
   *
   * @param {object} message - A message from waitForSharedEmail or waitForTripEmail
   * @param {string[]} unexpectedTexts
   */
  verifyEmailDoesNotContainTexts(message, unexpectedTexts) {
    if (!message || typeof message.body !== "string") {
      throw new Error('[Email.verifyEmailDoesNotContainTexts] "message" must come from the mailbox reader.');
    }
    if (!Array.isArray(unexpectedTexts) || unexpectedTexts.length === 0) {
      throw new Error(
        `[Email.verifyEmailDoesNotContainTexts] "unexpectedTexts" must be a non-empty array, got: ${unexpectedTexts}`
      );
    }

    // An empty body contains nothing, so the absence check below would pass on a mail that failed
    // to render at all.
    if (!message.body.trim()) {
      throw new Error(
        `[Email.verifyEmailDoesNotContainTexts] The received email (subject "${message.subject}") has ` +
          "an empty body, so the absence of anything in it proves nothing."
      );
    }

    const body = normalize(message.body);
    const present = unexpectedTexts.filter((text) => body.includes(normalize(text)));

    if (present.length > 0) {
      const contexts = present.map((text) => {
        const at = body.indexOf(normalize(text));
        return `  - "${text}" … ${body.slice(Math.max(0, at - 200), at + 200)}`;
      });
      throw new Error(
        `[Email.verifyEmailDoesNotContainTexts] The received email (subject "${message.subject}") ` +
          `contains ${present.length} string(s) it should not:\n${contexts.join("\n")}`
      );
    }

    logger.info("[Email.verifyEmailDoesNotContainTexts] None of the unexpected strings is in the email", {
      unexpectedTexts,
    });
  },

  /**
   * Verifies every expected string appears in a received email's body.
   *
   * Matching is whitespace-normalised and case-insensitive: the mail is an HTML table document,
   * so line breaks and casing between the preview and the delivered copy are not meaningful.
   *
   * @param {object} message - A message from waitForSharedEmail
   * @param {string[]} expectedTexts
   */
  verifyEmailContainsTexts(message, expectedTexts) {
    if (!message || typeof message.body !== "string") {
      throw new Error('[Email.verifyEmailContainsTexts] "message" must come from waitForSharedEmail.');
    }
    if (!Array.isArray(expectedTexts) || expectedTexts.length === 0) {
      throw new Error(
        `[Email.verifyEmailContainsTexts] "expectedTexts" must be a non-empty array, got: ${expectedTexts}`
      );
    }

    if (!message.body.trim()) {
      throw new Error(
        `[Email.verifyEmailContainsTexts] The received email (subject "${message.subject}") has an ` +
          "empty body, so nothing can be verified in it."
      );
    }

    const body = normalize(message.body);
    const missing = expectedTexts.filter((text) => !body.includes(normalize(text)));

    // Thrown rather than asserted through expect(): this Playwright version drops the custom
    // message passed to expect(value, message), and the list of what is missing is the whole
    // value of the failure.
    if (missing.length > 0) {
      throw new Error(
        `[Email.verifyEmailContainsTexts] The received email (subject "${message.subject}") is ` +
          `missing ${missing.length} of ${expectedTexts.length} expected strings:\n` +
          `${missing.map((text) => `  - "${text}"`).join("\n")}\n` +
          `Email body was: ${message.body.slice(0, 1500)}`
      );
    }

    logger.info("[Email.verifyEmailContainsTexts] All expected strings present in the received email", {
      count: expectedTexts.length,
    });
  },

  /**
   * Verifies a received email's SUBJECT contains an expected substring.
   *
   * Distinct from the subjectContains passed to waitForSharedEmail: that one only decides which
   * message to pick out of the inbox, and a run-unique key (a trip number, a traveller name) is
   * what makes it safe. This asserts the wording the app actually titled the mail with, which is
   * a property of the template and the thing a scenario about the subject cares about.
   *
   * Matching is whitespace-normalised and case-insensitive, in line with the body assertion: the
   * app pads the subject with the trip dates and a double space, which is not meaningful.
   *
   * @param {object} message - A message from waitForSharedEmail
   * @param {string} expectedSubject
   */
  verifyEmailSubjectContains(message, expectedSubject) {
    if (!message || typeof message.subject !== "string") {
      throw new Error('[Email.verifyEmailSubjectContains] "message" must come from waitForSharedEmail.');
    }
    if (typeof expectedSubject !== "string" || !expectedSubject.trim()) {
      throw new Error(
        `[Email.verifyEmailSubjectContains] "expectedSubject" must be a non-empty string, got: ${expectedSubject}`
      );
    }

    if (!message.subject.trim()) {
      throw new Error(
        "[Email.verifyEmailSubjectContains] The received email has an empty subject, so " +
          `"${expectedSubject}" cannot be verified in it.`
      );
    }

    // Thrown rather than asserted through expect(): this Playwright version drops the custom
    // message passed to expect(value, message), and the actual subject is the whole diagnostic.
    if (!normalize(message.subject).includes(normalize(expectedSubject))) {
      throw new Error(
        `[Email.verifyEmailSubjectContains] The received email's subject does not contain ` +
          `"${expectedSubject}".
Actual subject was: "${message.subject}"`
      );
    }

    logger.info("[Email.verifyEmailSubjectContains] Subject contains the expected text", {
      expectedSubject,
      subject: message.subject,
    });
  },

  /**
   * Verifies every expected link appears in a received email with the same target.
   *
   * A link is matched by its label (normalised, substring) and then its href is compared exactly:
   * a matching label pointing somewhere else is the failure this is here to catch.
   *
   * @param {object} message - A message from waitForSharedEmail
   * @param {Array<{text: string, href: string}>} expectedLinks
   */
  verifyEmailContainsLinks(message, expectedLinks) {
    if (!message || !Array.isArray(message.links)) {
      throw new Error('[Email.verifyEmailContainsLinks] "message" must come from waitForSharedEmail.');
    }
    if (!Array.isArray(expectedLinks) || expectedLinks.length === 0) {
      throw new Error(
        `[Email.verifyEmailContainsLinks] "expectedLinks" must be a non-empty array, got: ${expectedLinks}`
      );
    }

    const found = message.links;
    const problems = [];

    for (const expected of expectedLinks) {
      const match = found.find((link) => normalize(link.text).includes(normalize(expected.text)));

      if (!match) {
        problems.push(`"${expected.text}" — no link with that label in the email`);
        continue;
      }
      if (expected.href && match.href !== expected.href) {
        problems.push(
          `"${expected.text}" — points to "${match.href}" in the email but "${expected.href}" in the trip`
        );
      }
    }

    // Thrown rather than asserted through expect() for the same reason as above: the per-link
    // reason is the diagnostic, and expect()'s custom message never reaches the report.
    if (problems.length > 0) {
      throw new Error(
        `[Email.verifyEmailContainsLinks] The received email (subject "${message.subject}") does ` +
          `not match the links seen in the trip:\n${problems.map((problem) => `  - ${problem}`).join("\n")}\n` +
          `Links found in the email: ${JSON.stringify(found.map((link) => link.text).filter(Boolean))}`
      );
    }

    logger.info("[Email.verifyEmailContainsLinks] All expected links present with matching targets", {
      count: expectedLinks.length,
    });
  },
};

module.exports = Email;
