require("module-alias/register");
const { When, Then, setDefaultTimeout } = require("@cucumber/cucumber");
const { PayloadValidation } = require("@dsl");
const config = require("@config/config");
const logger = require("@utils/logger").child("PayloadValidation");

setDefaultTimeout(120000);

function getScenarioIdentifiers(world) {
  return {
    tripId: world.tripId || world.currentTripId || world.createdTripId || null,
    transactionId: world.transactionId || null,
    sid: world.sid || null,
  };
}

// Resolves world variable placeholders in expressions.
// {tripNumber} is a special alias for world.tripId (no world.tripNumber field exists).
// Any other {key} resolves generically against world[key] (e.g. {storedFirstQuotePnrCode}),
// so new stored values work without adding another one-off .replace() here.
function resolveWorldPlaceholders(expectedText, world) {
  if (!expectedText || !expectedText.includes('{')) return expectedText;
  const tripId = world.tripId || world.currentTripId || world.createdTripId || null;
  return expectedText.replace(/\{(\w+)\}/g, (match, key) => {
    if (key === 'tripNumber') return tripId ?? match;
    const value = world[key];
    // Only substitute primitives — an accidental brace match on a non-string world property
    // (e.g. {page}) must stay literal instead of coercing an object to "[object Object]".
    return typeof value === 'string' || typeof value === 'number' ? value : match;
  });
}

async function runPayloadValidationStep(world, stepName, metadata, action) {
  if (!config.payloadValidation.enabled) {
    logger.warn("PAYLOAD_VALIDATION_ENABLED=false", {
      step: stepName,
      ...metadata,
    });
    return;
  }

  await action();
}

async function expectCapturedContains(world, source, requestType, expectedText, logMessage, logMeta = {}) {
  await runPayloadValidationStep(
    world,
    "expectCapturedPayloadContains",
    { source, requestType, ...logMeta },
    async () => {
      const resolvedText = resolveWorldPlaceholders(expectedText, world);
      logger.info(logMessage, {
        source,
        requestType,
        ...logMeta,
        ...(resolvedText !== expectedText && { resolvedText }),
      });

      await PayloadValidation.expectCapturedPayloadContains(
        world.page,
        world,
        source,
        requestType,
        resolvedText
      );
    }
  );
}

async function expectCapturedNotContains(world, source, requestType, expectedText, logMessage, logMeta = {}) {
  await runPayloadValidationStep(
    world,
    "expectCapturedPayloadNotContains",
    { source, requestType, ...logMeta },
    async () => {
      const resolvedText = resolveWorldPlaceholders(expectedText, world);
      logger.info(logMessage, {
        source,
        requestType,
        ...logMeta,
        ...(resolvedText !== expectedText && { resolvedText }),
      });

      await PayloadValidation.expectCapturedPayloadNotContains(
        world.page,
        world,
        source,
        requestType,
        resolvedText
      );
    }
  );
}

// Primary wording
When("I capture the {string} payload for request type {string} from Storage", async function (source, requestType) {
  await runPayloadValidationStep(this, "capturePayloadByRequestType", { source, requestType }, async () => {
    const identifiers = getScenarioIdentifiers(this);
    logger.info("Capturing payload from Storage", { source, requestType, ...identifiers });

    const record = await PayloadValidation.capturePayloadByRequestType(
      this.page,
      this,
      source,
      requestType,
      identifiers
    );

    this.lastCapturedParserPayload = record;
    logger.info("Payload captured from Storage", {
      source: record.source,
      requestType: record.requestType,
      capturedAt: record.capturedAt,
    });
  });
});

// For a call a background process makes minutes after the action (e.g. the passive hotel
// PNR_AddMultiElements of #85676). Registers the check instead of waiting for the call: the
// scenario finishes now, and scripts/verify-deferred-payload-checks.js polls for it once the whole
// run is over, writing a failure back onto this scenario. One table row per expected text; each
// must appear in at least one logged call of the type, as with the "should contain" steps.
Then(
  "after the run, the {string} payload for request type {string} should contain:",
  async function (source, requestType, dataTable) {
    await runPayloadValidationStep(this, "registerDeferredPayloadCheck", { source, requestType }, async () => {
      const normalizedSource = String(source).trim().toLowerCase();
      if (normalizedSource !== "request" && normalizedSource !== "response") {
        throw new Error(`source must be either "request" or "response", got: ${source}`);
      }

      const { tripId } = getScenarioIdentifiers(this);
      if (!tripId) {
        throw new Error("A deferred payload check needs the trip number, but none was captured for this scenario.");
      }

      const expectedTexts = dataTable.raw().map(([text]) => resolveWorldPlaceholders(text, this)).filter(Boolean);
      if (expectedTexts.length === 0) {
        throw new Error("A deferred payload check needs at least one expected text in its table.");
      }

      this.deferredPayloadChecks = this.deferredPayloadChecks || [];
      this.deferredPayloadChecks.push({
        source: normalizedSource,
        requestType: requestType.trim(),
        tripId: String(tripId),
        expectedTexts,
        registeredAt: new Date().toISOString(),
      });
      logger.info("Deferred payload check registered — verified after the run", {
        source: normalizedSource,
        requestType,
        expectedTexts,
        tripId,
      });
    });
  },
);

// A fixed, reused trip keeps the calls of every earlier run in storage. Noting the time right before
// the action lets the capture below ignore them, so the assertion can only pass on this run's call.
When("I note the time before new payload requests are sent", async function () {
  this.payloadRequestsNotBefore = new Date();
  logger.info("Noted the time before new payload requests are sent", {
    notBefore: this.payloadRequestsNotBefore.toISOString(),
  });
});

When("I capture the latest {string} payload for request type {string} sent since the noted time from Storage", async function (source, requestType) {
  await runPayloadValidationStep(this, "capturePayloadSentSince", { source, requestType }, async () => {
    const identifiers = getScenarioIdentifiers(this);
    logger.info("Capturing the latest payload sent since the noted time", {
      source,
      requestType,
      notBefore: this.payloadRequestsNotBefore?.toISOString(),
      ...identifiers,
    });

    const record = await PayloadValidation.capturePayloadSentSince(
      this.page,
      this,
      source,
      requestType,
      this.payloadRequestsNotBefore,
      identifiers
    );

    this.lastCapturedParserPayload = record;
    logger.info("Payload sent since the noted time captured and pinned", {
      source: record.source,
      requestType: record.requestType,
      rowKey: record.rowKey,
    });
  });
});

// Captures the other half of the call captured just before — the response of that request, or the
// request of that response. Use it when a trip sends the same request type several times and the
// assertion must stay on ONE of them (e.g. one post-creation FQTV call per carrier): capture the
// request, assert what identifies it, then capture its response with this step. The request type
// is inherited from the previous capture, so it is not repeated here.
When("I capture the {string} payload from the previous {string} from Storage", async function (source, previousSource) {
  await runPayloadValidationStep(this, "capturePayloadFromPreviousCapture", { source, previousSource }, async () => {
    logger.info("Capturing the counterpart of the previous capture from Storage", {
      source,
      previousSource,
      ...getScenarioIdentifiers(this),
    });

    const record = await PayloadValidation.capturePayloadFromPreviousCapture(
      this.page,
      this,
      source,
      previousSource
    );

    this.lastCapturedParserPayload = record;
    logger.info("Counterpart payload captured from Storage", {
      source: record.source,
      requestType: record.requestType,
      rowKey: record.rowKey,
      capturedAt: record.capturedAt,
    });
  });
});

Then("the captured {string} payload for request type {string} should contain {string}", async function (source, requestType, expectedText) {
  await expectCapturedContains(
    this,
    source,
    requestType,
    expectedText,
    "Validating captured payload contains text",
    { expectedTextLength: String(expectedText || "").length }
  );
});

Then("the captured {string} payload for request type {string} should not contain {string}", async function (source, requestType, expectedText) {
  await expectCapturedNotContains(
    this,
    source,
    requestType,
    expectedText,
    "Validating captured payload does not contain text",
    { expectedTextLength: String(expectedText || "").length }
  );
});

Then("the captured {string} payload for request type {string} should contain either {string} or {string}", async function (source, requestType, firstText, secondText) {
  await runPayloadValidationStep(this, "expectCapturedPayloadContainsAny", { source, requestType }, async () => {
    const expectedTexts = [firstText, secondText].map((text) => resolveWorldPlaceholders(text, this));
    logger.info("Validating captured payload contains either text", { source, requestType, expectedTexts });

    await PayloadValidation.expectCapturedPayloadContainsAny(this.page, this, source, requestType, expectedTexts);
  });
});

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.split\(,\)$/,
  async function (source, requestType, expectedText) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `${expectedText}.split(,)`,
      "Validating captured payload contains split parts",
      { expectedTextLength: String(expectedText || "").length }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.split\(,\)$/,
  async function (source, requestType, expectedText) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `${expectedText}.split(,)`,
      "Validating captured payload does not contain split parts",
      { expectedTextLength: String(expectedText || "").length }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.split\("([^"]*)"\)$/,
  async function (source, requestType, expectedText, delimiter) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `${expectedText}.split("${delimiter}")`,
      "Validating captured payload contains split parts",
      {
        expectedTextLength: String(expectedText || "").length,
        delimiter,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.split\("([^"]*)"\)$/,
  async function (source, requestType, expectedText, delimiter) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `${expectedText}.split("${delimiter}")`,
      "Validating captured payload does not contain split parts",
      {
        expectedTextLength: String(expectedText || "").length,
        delimiter,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.split\(,\)\[(\d+)\]$/,
  async function (source, requestType, expectedText, splitIndex) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `${expectedText}.split(,)[${splitIndex}]`,
      "Validating captured payload contains indexed split part",
      {
        expectedTextLength: String(expectedText || "").length,
        splitIndex: Number(splitIndex),
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.split\(,\)\[(\d+)\]$/,
  async function (source, requestType, expectedText, splitIndex) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `${expectedText}.split(,)[${splitIndex}]`,
      "Validating captured payload does not contain indexed split part",
      {
        expectedTextLength: String(expectedText || "").length,
        splitIndex: Number(splitIndex),
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.split\("([^"]*)"\)\[(\d+)\]$/,
  async function (source, requestType, expectedText, delimiter, splitIndex) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `${expectedText}.split("${delimiter}")[${splitIndex}]`,
      "Validating captured payload contains indexed split part",
      {
        expectedTextLength: String(expectedText || "").length,
        delimiter,
        splitIndex: Number(splitIndex),
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.split\("([^"]*)"\)\[(\d+)\]$/,
  async function (source, requestType, expectedText, delimiter, splitIndex) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `${expectedText}.split("${delimiter}")[${splitIndex}]`,
      "Validating captured payload does not contain indexed split part",
      {
        expectedTextLength: String(expectedText || "").length,
        delimiter,
        splitIndex: Number(splitIndex),
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.map\("([^"]*)"\)$/,
  async function (source, requestType, mappedLabel, pattern) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `"${mappedLabel}".map("${pattern}")`,
      "Validating captured payload contains mapped code pattern",
      {
        mappedLabel,
        pattern,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.map\("([^"]*)"\)$/,
  async function (source, requestType, mappedLabel, pattern) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `"${mappedLabel}".map("${pattern}")`,
      "Validating captured payload does not contain mapped code pattern",
      {
        mappedLabel,
        pattern,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.onKey\("([^"]*)"\)$/,
  async function (source, requestType, expectedValue, key) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `"${expectedValue}".onKey("${key}")`,
      "Validating captured payload contains key-value expression",
      {
        key,
        expectedValue,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.onKey\("([^"]*)"\)$/,
  async function (source, requestType, expectedValue, key) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `"${expectedValue}".onKey("${key}")`,
      "Validating captured payload does not contain key-value expression",
      {
        key,
        expectedValue,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should contain "([^"]*)"\.block\("([^"]*)"\)$/,
  async function (source, requestType, searchText, blockTag) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      `"${searchText}".block("${blockTag}")`,
      "Extracting and storing matched payload block",
      {
        searchText,
        blockTag,
      }
    );
  }
);

Then(
  /^the captured "([^"]*)" payload for request type "([^"]*)" should not contain "([^"]*)"\.block\("([^"]*)"\)$/,
  async function (source, requestType, searchText, blockTag) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      `"${searchText}".block("${blockTag}")`,
      "Validating captured payload does not contain block match",
      {
        searchText,
        blockTag,
      }
    );
  }
);

Then(
  "the captured {string} payload for request type {string} should contain the multiline text:",
  async function (source, requestType, expectedTextBlock) {
    await expectCapturedContains(
      this,
      source,
      requestType,
      expectedTextBlock,
      "Validating captured payload contains text block",
      { expectedTextLength: String(expectedTextBlock || "").length }
    );
  }
);

Then(
  "the captured {string} payload for request type {string} should not contain the multiline text:",
  async function (source, requestType, expectedTextBlock) {
    await expectCapturedNotContains(
      this,
      source,
      requestType,
      expectedTextBlock,
      "Validating captured payload does not contain text block",
      { expectedTextLength: String(expectedTextBlock || "").length }
    );
  }
);

Then(
  "the captured {string} payload for request type {string} should contain the XML:",
  async function (source, requestType, expectedXmlBlock) {
    await runPayloadValidationStep(this, "expectCapturedPayloadContainsXmlBlock", {
      source,
      requestType,
      expectedXmlLength: String(expectedXmlBlock || "").length,
    }, async () => {
      logger.info("Validating captured payload contains XML with all key-value pairs", {
        source,
        requestType,
        expectedXmlLength: String(expectedXmlBlock || "").length,
      });

      await PayloadValidation.expectCapturedPayloadContainsXmlBlock(
        this.page,
        this,
        source,
        requestType,
        expectedXmlBlock
      );
    });
  }
);
  Then(
    "the captured {string} payload for request type {string} should not contain the XML:",
    async function (source, requestType, expectedXmlBlock) {
      await runPayloadValidationStep(this, "expectCapturedPayloadNotContainsXmlBlock", {
        source,
        requestType,
        expectedXmlLength: String(expectedXmlBlock || "").length,
      }, async () => {
        logger.info("Validating captured payload does not contain XML with all key-value pairs", {
          source,
          requestType,
          expectedXmlLength: String(expectedXmlBlock || "").length,
        });

        await PayloadValidation.expectCapturedPayloadNotContainsXmlBlock(
          this.page,
          this,
          source,
          requestType,
          expectedXmlBlock
        );
      });
    }
  );

// Shared body of the two "should contain the JSON" steps. nullMatchesMissing lets an expected null
// also be met by an absent key — for logs whose serializer drops null properties
// (TransferzPay-by-creditcard omits refusalReason).
async function verifyCapturedPayloadContainsJsonBlock(world, source, requestType, expectedJsonBlock, { nullMatchesMissing = false } = {}) {
  await runPayloadValidationStep(world, "expectCapturedPayloadContainsJsonBlock", {
    source,
    requestType,
  }, async () => {
    const resolvedBlock = resolveWorldPlaceholders(expectedJsonBlock, world);
    logger.info("Validating captured payload contains JSON with all key-value pairs", {
      source,
      requestType,
      nullMatchesMissing,
      expectedJsonLength: String(resolvedBlock || "").length,
    });

    await PayloadValidation.expectCapturedPayloadContainsJsonBlock(
      world.page,
      world,
      source,
      requestType,
      resolvedBlock,
      { nullMatchesMissing }
    );
  });
}

Then(
  "the captured {string} payload for request type {string} should contain the JSON, where null also matches a missing key:",
  async function (source, requestType, expectedJsonBlock) {
    await verifyCapturedPayloadContainsJsonBlock(this, source, requestType, expectedJsonBlock, { nullMatchesMissing: true });
  }
);

Then(
  "the captured {string} payload for request type {string} should contain the JSON:",
  async function (source, requestType, expectedJsonBlock) {
    await verifyCapturedPayloadContainsJsonBlock(this, source, requestType, expectedJsonBlock);
  }
);

Then(
  "the captured {string} payload for request type {string} should not contain the JSON:",
  async function (source, requestType, expectedJsonBlock) {
    await runPayloadValidationStep(this, "expectCapturedPayloadNotContainsJsonBlock", {
      source,
      requestType,
    }, async () => {
      const resolvedBlock = resolveWorldPlaceholders(expectedJsonBlock, this);
      logger.info("Validating captured payload does not contain JSON with all key-value pairs", {
        source,
        requestType,
        expectedJsonLength: String(resolvedBlock || "").length,
      });

      await PayloadValidation.expectCapturedPayloadNotContainsJsonBlock(
        this.page,
        this,
        source,
        requestType,
        resolvedBlock
      );
    });
  }
);

Then(
  "in the captured {string} payload for request type {string}, path {string} should exist",
  async function (source, requestType, path) {
    await runPayloadValidationStep(this, "expectCapturedPayloadPathExists", { source, requestType, path }, async () => {
      logger.info("Validating captured payload path exists", { source, requestType, path });
      await PayloadValidation.expectCapturedPayloadPathExists(this.page, this, source, requestType, path);
    });
  }
);

// Reads one value out of a payload already captured and keeps it on the World, so a later
// assertion can compare a second payload against it with "{name}". Needed whenever the expected
// value is generated by the supplier at run time and cannot be written into the feature file.
When(
  "I store the value at path {string} from the captured {string} payload for request type {string} as {string}",
  async function (path, source, requestType, variableName) {
    await runPayloadValidationStep(this, "storeCapturedPayloadPathValue", {
      source,
      requestType,
      path,
      variableName,
    }, async () => {
      const storedValue = await PayloadValidation.storeCapturedPayloadPathValue(
        this.page,
        this,
        source,
        requestType,
        path,
        variableName
      );
      logger.info("Stored captured payload value on the World", {
        source,
        requestType,
        path,
        variableName,
        storedValue,
      });
    });
  }
);

When(
  "I store the XML attribute {string} of the first {string} element whose {string} is {string} in the captured {string} payload for request type {string} as {string}",
  async function (attributeName, elementTag, filterAttribute, filterValue, source, requestType, variableName) {
    await runPayloadValidationStep(this, "storeCapturedXmlAttributeValue", {
      source,
      requestType,
      elementTag,
      attributeName,
      variableName,
    }, async () => {
      const storedValue = await PayloadValidation.storeCapturedXmlAttributeValue(
        this.page,
        this,
        source,
        requestType,
        elementTag,
        filterAttribute,
        filterValue,
        attributeName,
        variableName
      );
      logger.info("Stored captured XML attribute on the World", {
        source,
        requestType,
        elementTag,
        attributeName,
        variableName,
        storedValue,
      });
    });
  }
);

Then(
  "in the captured {string} payload for request type {string}, every {string} element should have XML attribute {string} equal to {string}",
  async function (source, requestType, elementTag, attributeName, expectedValue) {
    await runPayloadValidationStep(this, "expectCapturedXmlAttributeOnEveryElement", {
      source,
      requestType,
      elementTag,
      attributeName,
    }, async () => {
      const resolvedValue = resolveWorldPlaceholders(expectedValue, this);
      logger.info("Validating XML attribute on every element", {
        source,
        requestType,
        elementTag,
        attributeName,
        expectedValue: resolvedValue,
      });
      await PayloadValidation.expectCapturedXmlAttributeOnEveryElement(
        this.page,
        this,
        source,
        requestType,
        elementTag,
        attributeName,
        resolvedValue
      );
    });
  }
);

Then(
  "in the captured {string} payload for request type {string}, path {string} should contain {string}",
  async function (source, requestType, path, expectedValue) {
    await runPayloadValidationStep(this, "expectCapturedPayloadPathContains", {
      source,
      requestType,
      path,
    }, async () => {
      logger.info("Validating captured payload path contains", { source, requestType, path, expectedValue });
      await PayloadValidation.expectCapturedPayloadPathContains(
        this.page,
        this,
        source,
        requestType,
        path,
        expectedValue
      );
    });
  }
);

// Capture half of an ABSENCE check: lists every request type the trip logged, so the assertion
// below can prove one is missing. Capturing by request type cannot do that — it throws when the
// type is absent, which is exactly the outcome under test.
When("I capture all the {string} types from Storage", async function (source) {
  await runPayloadValidationStep(this, "captureRequestTypes", { source }, async () => {
    logger.info("Capturing every request type logged for the trip", {
      source,
      ...getScenarioIdentifiers(this),
    });

    const record = await PayloadValidation.captureRequestTypes(this.page, this, source);

    logger.info("Request type inventory captured from Storage", {
      source: record.source,
      typeCount: record.types.length,
      entryCount: record.entryCount,
      capturedAt: record.capturedAt,
    });
  });
});

Then("the captured {string} types do not contain request type {string}", async function (source, requestType) {
  await runPayloadValidationStep(this, "expectCapturedRequestTypesNotContaining", {
    source,
    requestType,
  }, async () => {
    logger.info("Validating the captured type inventory does not contain the request type", {
      source,
      requestType,
    });

    await PayloadValidation.expectCapturedRequestTypesNotContaining(this, source, requestType);
  });
});

// Fare family batching steps live in flight_nff.steps.js / FlightResults DSL: the counting is
// product-specific (branded fares), this file stays generic payload plumbing.

// Anchor for an absence assertion: the distributor log publishes asynchronously, so "0 of X were
// sent" read too early means "not published yet", not "never sent". Waiting for a request the flow
// definitely makes proves the log is live for this trip before anything is claimed absent.
When("I wait until {string} requests have been sent for the trip", async function (requestType) {
  await runPayloadValidationStep(this, "waitForRequestType", { requestType }, async () => {
    logger.info("Waiting for the request type to appear in the trip log", {
      requestType,
      ...getScenarioIdentifiers(this),
    });
    const count = await PayloadValidation.waitForRequestType(this, requestType);
    logger.info("Request type present in the trip log", { requestType, count });
  });
});

When("I capture the number of {string} requests sent for the trip", async function (requestType) {
  await runPayloadValidationStep(this, "captureRequestCount", { requestType }, async () => {
    logger.info("Capturing baseline request count", { requestType, ...getScenarioIdentifiers(this) });
    await PayloadValidation.captureRequestCount(this.page, this, requestType);
  });
});

Then(
  "no additional {string} requests should have been sent after {string}",
  async function (requestType, anchorRequestType) {
    await runPayloadValidationStep(this, "expectRequestCountUnchanged", {
      requestType,
      anchorRequestType,
    }, async () => {
      logger.info("Validating no additional requests were sent", { requestType, anchorRequestType });
      await PayloadValidation.expectRequestCountUnchanged(this.page, this, requestType, anchorRequestType);
    });
  }
);

Then(
  "exactly {int} {string} requests should have been sent",
  async function (expectedCount, requestType) {
    await runPayloadValidationStep(this, "expectRequestCountEquals", {
      requestType,
      expectedCount,
    }, async () => {
      logger.info("Validating the total request count", { requestType, expectedCount });
      await PayloadValidation.expectRequestCountEquals(this.page, this, requestType, expectedCount);
    });
  }
);

async function expectRequestCountContaining(world, expectedCount, requestType, expectedTexts) {
  await runPayloadValidationStep(world, "expectRequestCountContaining", {
    requestType,
    expectedTexts,
    expectedCount,
  }, async () => {
    logger.info("Validating how many requests carry the text", { requestType, expectedTexts, expectedCount });
    await PayloadValidation.expectRequestCountContaining(world.page, world, requestType, expectedTexts, expectedCount);
  });
}

Then(
  "exactly {int} {string} requests should contain {string}",
  async function (expectedCount, requestType, expectedText) {
    await expectRequestCountContaining(this, expectedCount, requestType, [expectedText]);
  }
);

// Both texts in the SAME request - e.g. the RW upsell call that also carries FFH.
Then(
  "exactly {int} {string} requests should contain both {string} and {string}",
  async function (expectedCount, requestType, firstText, secondText) {
    await expectRequestCountContaining(this, expectedCount, requestType, [firstText, secondText]);
  }
);

Then(
  "every {string} request should contain {string}",
  async function (requestType, parameterName) {
    await runPayloadValidationStep(this, "expectEveryRequestContainsParameter", {
      requestType,
      parameterName,
    }, async () => {
      logger.info("Validating every request carries the parameter", { requestType, parameterName });
      await PayloadValidation.expectEveryRequestContainsParameter(
        this.page,
        this,
        requestType,
        parameterName
      );
    });
  }
);

Then(
  "every {string} request should have {string} containing {string}",
  async function (requestType, parameterName, expectedValue) {
    await runPayloadValidationStep(this, "expectEveryRequestParameterContains", {
      requestType,
      parameterName,
    }, async () => {
      const resolvedValue = resolveWorldPlaceholders(expectedValue, this);
      logger.info("Validating the parameter value on every request", {
        requestType,
        parameterName,
        expectedValue: resolvedValue,
      });
      await PayloadValidation.expectEveryRequestParameterContains(
        this.page,
        this,
        requestType,
        parameterName,
        resolvedValue
      );
    });
  }
);

Then(
  "every {string} request should have {string} within {string} containing {string}",
  async function (requestType, parameterName, withinBlock, expectedValue) {
    await runPayloadValidationStep(this, "expectEveryRequestParameterContains", {
      requestType,
      parameterName,
      withinBlock,
    }, async () => {
      const resolvedValue = resolveWorldPlaceholders(expectedValue, this);
      logger.info("Validating the parameter value inside a block on every request", {
        requestType,
        parameterName,
        withinBlock,
        expectedValue: resolvedValue,
      });
      await PayloadValidation.expectEveryRequestParameterContains(
        this.page,
        this,
        requestType,
        parameterName,
        resolvedValue,
        withinBlock
      );
    });
  }
);

Then(
  "every {string} request should reference a different {string}",
  async function (requestType, attributeName) {
    await runPayloadValidationStep(this, "expectRequestAttributeValuesAreUnique", {
      requestType,
      attributeName,
    }, async () => {
      logger.info("Validating request attribute values are unique", { requestType, attributeName });
      await PayloadValidation.expectRequestAttributeValuesAreUnique(
        this.page,
        this,
        requestType,
        attributeName
      );
    });
  }
);

Then(
  "no two {string} requests should have the same body ignoring {string}",
  // Settling the count and paced downloads of every request outrun the 120 s default.
  { timeout: 240000 },
  async function (requestType, ignoredFieldList) {
    const ignoredFields = ignoredFieldList.split(",").map((field) => field.trim()).filter(Boolean);
    await runPayloadValidationStep(this, "expectNoIdenticalRequestBodies", {
      requestType,
      ignoredFields,
    }, async () => {
      logger.info("Validating no two requests share a body", { requestType, ignoredFields });
      await PayloadValidation.expectNoIdenticalRequestBodies(this.page, this, requestType, ignoredFields);
    });
  }
);

Then(
  "in the captured {string} payload for request type {string}, path {string} should not contain {string}",
  async function (source, requestType, path, expectedValue) {
    await runPayloadValidationStep(this, "expectCapturedPayloadPathNotContains", {
      source,
      requestType,
      path,
    }, async () => {
      logger.info("Validating captured payload path does not contain", { source, requestType, path, expectedValue });
      await PayloadValidation.expectCapturedPayloadPathNotContains(
        this.page,
        this,
        source,
        requestType,
        path,
        expectedValue
      );
    });
  }
);
