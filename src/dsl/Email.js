/**
 * Email DSL
 *
 * Assertions against the mail the application actually sends — share quote and share itinerary
 * emails today. Sits on top of @utils/mailbox, which owns the provider REST calls.
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
const logger = require("@utils/logger").child("Email-DSL");

const normalize = (value) => (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

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
