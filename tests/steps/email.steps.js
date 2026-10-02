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
const BenerailResults = require("@dsl/BenerailResults");
const logger = require("@utils/logger").child("Email-Steps");

/**
 * Resolves the address the itinerary was shared to, failing with the fix rather than a
 * "cannot read property of undefined" when the recipient step did not run.
 *
 * Stays in the glue layer on purpose: the whole value of this guard is an error that names the
 * Gherkin step to add, and a DSL that knew step phrases would be reaching back up a layer.
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
 * Reads the share email once per scenario and caches it on the World.
 *
 * The cache is the reason this is here rather than in the DSL, and it is not an optimisation:
 * @utils/mailbox DELETES a message once it has been read, so a second read for the same scenario
 * would poll an empty inbox until it timed out. Scenario-lifetime state belongs to the World.
 *
 * @param {object} world - The cucumber World (`this` in a step)
 * @param {string} [subjectContains] - Overrides the itinerary hint, e.g. for share-quotes mail
 * @returns {Promise<object>} The received message
 */
async function receivedItineraryEmail(world, subjectContains) {
  if (world.receivedItineraryEmail) {
    return world.receivedItineraryEmail;
  }

  world.receivedItineraryEmail = await Email.receiveShareEmail(world.page, {
    to: requireItineraryRecipient(world),
    subjectContains,
    tripNumberCandidates: world.getTripNumberCandidates(),
    sentAfter: world.itineraryShareSentAfter,
  });

  return world.receivedItineraryEmail;
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

// Same body assertion as the itinerary step above, but for the share-QUOTES template — only the
// subject the message is FOUND by differs (see Email.resolveShareQuotesSubjectHint). Kept as its own phrase
// rather than branching inside one step: which template was sent is a property of the flow the
// scenario ran, not something the step can sniff after the fact.
Then("the received share quotes email should contain {string}", async function (expectedText) {
  logger.info("Verifying the received share quotes email contains text", { expectedText });
  const message = await receivedItineraryEmail(
    this,
    Email.resolveShareQuotesSubjectHint({ traveller: this.lastAddedGuestName })
  );
  Email.verifyEmailContainsTexts(message, [expectedText]);
});

// Asserts the TITLE the app gave the mail, which the step above never proves: the subject there is
// only the key the message is looked up by, and that key is built from the traveller name rather
// than read from the message. Shares the once-per-scenario cached message, so this costs no extra
// mailbox read -- and must not, since a read deletes the message from the inbox.
Then("the received share quotes email should contain subject {string}", async function (expectedSubject) {
  logger.info("Verifying the received share quotes email subject", { expectedSubject });
  const message = await receivedItineraryEmail(
    this,
    Email.resolveShareQuotesSubjectHint({ traveller: this.lastAddedGuestName })
  );
  Email.verifyEmailSubjectContains(message, expectedSubject);
});

// Holds the delivered itinerary to the train information read off the results page's Journey
// Details (see benerail_results.steps.js) — every leg's times, stations and train, in order within
// the journey's own section, plus its change count and total duration.
Then(
  "the received itinerary email should contain all {string} train information from results",
  async function (leg) {
    const trainInformation = this.benerailResultsTrainInformation?.[leg];
    if (!trainInformation) {
      throw new Error(
        `[email.steps] No ${leg} train information was extracted from the results page — expected ` +
          `'I extract all train information from the "${leg}" journey details in results' to have run first`
      );
    }
    logger.info("Verifying the received itinerary email contains the results train information", { leg, trainInformation });

    const message = await receivedItineraryEmail(this);
    try {
      BenerailResults.verifyItineraryEmailTrainInformation(message.body, leg, trainInformation);
    } catch (error) {
      this.attach(message.body, "text/plain");
      throw error;
    }
  }
);

// Mail the app sends by itself after ticketing goes to the traveller's PROFILE email, so `inbox` is
// the reserved Mailsac address that traveller was created with (69689: Carlos Marcelo ->
// atriis-qa@mailsac.com), not one the test generates. It lands after ticketing rather than on a
// click, hence the longer wait than a share's MAILBOX_TIMEOUT_MS.
const TRIP_EMAIL_TIMEOUT_MS = 10 * 60 * 1000;

Then("the {string} email for this trip should be received at {string}", { timeout: TRIP_EMAIL_TIMEOUT_MS + 60 * 1000 }, async function (subjectPrefix, inbox) {
  logger.info("Waiting for the trip email sent to the traveller", { subjectPrefix, inbox });

  const message = await Email.waitForTripEmail({
    to: inbox,
    subjectContains: subjectPrefix,
    tripNumberCandidates: this.getTripNumberCandidates(),
    sentAfter: this.scenarioStartedAt,
    timeoutMs: TRIP_EMAIL_TIMEOUT_MS,
  });

  // Read once: @utils/mailbox deletes the message after fetching it, so later steps use this copy.
  this.receivedTripEmail = message;
  this.attach(message.html || message.body, message.html ? "text/html" : "text/plain");
});

Then("the price breakdown in the received e-ticket confirmation email should not include additional charges", async function () {
  const message = this.receivedTripEmail;
  if (!message) {
    throw new Error(
      "[email.steps] No e-ticket confirmation email was read. Add " +
        '\'Then the "E-ticket confirmation for" email for this trip should be received at "<inbox>"\' first.'
    );
  }
  logger.info("Verifying the e-ticket confirmation price breakdown has no additional charges", {
    subject: message.subject,
  });

  // Bug 68984: the price box listed "Tax: €46.58" and then the same amount again as
  // "Add. Charges: 46.58". An empty body is rejected by the DSL, and the previous step already
  // proved the mail is for this trip, so the absence cannot pass on a mail that never rendered.
  Email.verifyEmailDoesNotContainTexts(message, ["Add. Charges", "Additional charges"]);
});

Then("the received itinerary email should contain the link {string}", async function (linkLabel) {
  logger.info("Verifying the received itinerary email contains a link", { linkLabel });
  const message = await receivedItineraryEmail(this);
  // No href given, so this asserts the labelled link exists; the preview comparison is what
  // checks the target.
  Email.verifyEmailContainsLinks(message, [{ text: linkLabel, href: "" }]);
});
