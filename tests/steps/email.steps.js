/**
 * Received Email Steps
 *
 * Assertions against the mail the application actually delivered, read back from the test
 * mailbox configured by MAILBOX_* (see .env.example and src/utils/mailbox.js).
 *
 * These steps pair with the share-dialog steps in cart.steps.js:
 *   When I add a generated email address as the itinerary recipient
 *   And I send the email and see success notification
 *   Then the received itinerary email should match the itinerary preview
 *
 * The recipient step generates an address inside the test mailbox and stamps the send time;
 * the share-preview verification steps record what the preview was proven to contain. These
 * steps then read the delivered message and hold it to the same content.
 *
 * With no mailbox configured these steps fail with a configuration error rather than passing —
 * an email assertion that quietly skips is worse than no assertion at all.
 */

const { Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const Email = require("@dsl/Email");
const config = require("@config/config");
const logger = require("@utils/logger").child("Email-Steps");

// What tells this run's mail apart from another's.
//
// With a per-scenario generated address the inbox itself was the discriminator, so no subject
// filter was needed. A reserved MAILBOX_ADDRESS is shared by every scenario and by every parallel
// worker, so the address no longer discriminates and something else must: two scenarios sending
// within the same window would otherwise each match the other's message.
//
// The trip number does the job. The app titles these "Travel plan for <traveller> trip <id> …",
// and while the share dialog's Language selector localises the wording, a bare number survives
// it — which is exactly why the number is matched and not the phrasing.
const TRIP_NUMBER_IN_URL = /\/trips\/(\d+)(?:[/?#]|$)/i;

/**
 * Resolves the trip number whose itinerary was shared, to narrow the mailbox read to this run.
 *
 * Prefers the open page's URL — the share dialog is opened on the trip being shared, so that is
 * the trip, not merely a trip the scenario touched — then falls back to the well-known World
 * fields, mirroring how tests/support/hooks.js gathers trip ids for reporting.
 *
 * @param {object} world - The cucumber World (`this` in a step)
 * @returns {string|undefined}
 */
function resolveSharedTripNumber(world) {
  try {
    const match = String(world.page?.url() || "").match(TRIP_NUMBER_IN_URL);
    if (match) return match[1];
  } catch {
    // Page may be closed or navigating — fall through to the world fields.
  }

  for (const id of [world.tripId, world.currentTripId, world.createdTripId]) {
    if (id !== null && id !== undefined && String(id).trim()) return String(id).trim();
  }

  const recorded = Array.isArray(world.tripIds) ? world.tripIds.filter(Boolean) : [];
  return recorded.length ? String(recorded[recorded.length - 1]) : undefined;
}

/**
 * The subject substring the mailbox read is narrowed to.
 *
 * Throws rather than reading an unfiltered shared inbox: matching another scenario's mail is a
 * pass for the wrong reason, which is worse than the failure this raises.
 *
 * @param {object} world - The cucumber World (`this` in a step)
 * @returns {string|undefined}
 */
function itinerarySubjectHint(world) {
  const tripNumber = resolveSharedTripNumber(world);
  if (tripNumber) return tripNumber;

  if (config.mailbox.address) {
    throw new Error(
      "[email.steps] Could not work out which trip was shared, and MAILBOX_ADDRESS is a single " +
        "inbox shared by every scenario — reading it unfiltered could match another run's mail. " +
        "Record the trip number on the world (this.recordTripId) before sharing, or open the " +
        "trip page so its URL carries the number."
    );
  }

  // Per-scenario generated address: the inbox is already this run's, so no filter is needed.
  return undefined;
}

/**
 * Resolves the address the itinerary was shared to, failing with the fix rather than a
 * "cannot read property of undefined" when the recipient step did not run.
 *
 * @param {object} world - The cucumber World (`this` in a step)
 * @returns {string}
 */
function requireItineraryRecipient(world) {
  const recipient = world.generatedItineraryRecipient;
  if (!recipient) {
    throw new Error(
      "[email.steps] No itinerary recipient was recorded. Add " +
        '"When I add a generated email address as the itinerary recipient" before sending the share.'
    );
  }
  return recipient;
}

/**
 * Waits for the itinerary email once per scenario and caches it: a scenario may assert several
 * things about the same message, and each wait is a real poll against an external API.
 *
 * @param {object} world - The cucumber World (`this` in a step)
 * @param {string} [subjectContains]
 * @returns {Promise<object>} The received message
 */
async function receivedItineraryEmail(world, subjectContains) {
  if (world.receivedItineraryEmail) {
    return world.receivedItineraryEmail;
  }

  const message = await Email.waitForSharedEmail({
    to: requireItineraryRecipient(world),
    subjectContains: subjectContains ?? itinerarySubjectHint(world),
    sentAfter: world.itineraryShareSentAfter,
  });

  world.receivedItineraryEmail = message;
  return message;
}

Then("the itinerary email should be received", async function () {
  const recipient = requireItineraryRecipient(this);
  logger.info("Waiting for the shared itinerary email to arrive", { recipient });

  const message = await receivedItineraryEmail(this);

  expect(message.body, `The itinerary email delivered to "${recipient}" should not be empty`).toBeTruthy();
  logger.info("Itinerary email received", { subject: message.subject, linkCount: message.links.length });
});

// The Testim original extracted the split-ticket instruction and the two wallet links from the
// itinerary before sending, then re-read them from the delivered mail. This is that comparison:
// everything the preview steps proved is held against the received message.
Then("the received itinerary email should match the itinerary preview", async function () {
  const expectations = this.emailPreviewExpectations;
  const hasExpectations = expectations.texts.length > 0 || expectations.links.length > 0;

  if (!hasExpectations) {
    throw new Error(
      "[email.steps] Nothing was recorded from the itinerary preview, so there is nothing to " +
        "compare the received email against. Run the share-preview verification steps " +
        "(split ticket information, wallet links) before this step."
    );
  }

  logger.info("Comparing the received itinerary email against the preview", {
    texts: expectations.texts,
    links: expectations.links.map((link) => link.text),
  });

  const message = await receivedItineraryEmail(this);

  if (expectations.texts.length > 0) {
    Email.verifyEmailContainsTexts(message, expectations.texts);
  }
  if (expectations.links.length > 0) {
    Email.verifyEmailContainsLinks(message, expectations.links);
  }
});

Then("the received itinerary email should contain {string}", async function (expectedText) {
  logger.info("Verifying the received itinerary email contains text", { expectedText });
  const message = await receivedItineraryEmail(this);
  Email.verifyEmailContainsTexts(message, [expectedText]);
});

Then("the received itinerary email should contain the link {string}", async function (linkLabel) {
  logger.info("Verifying the received itinerary email contains a link", { linkLabel });
  const message = await receivedItineraryEmail(this);
  // No href given, so this asserts the labelled link exists; the preview comparison is what
  // checks the target.
  Email.verifyEmailContainsLinks(message, [{ text: linkLabel, href: "" }]);
});
