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
// Supported: {tripNumber} → world.tripId, {transactionId} → world.transactionId, {sid} → world.sid
function resolveWorldPlaceholders(expectedText, world) {
  if (!expectedText || !expectedText.includes('{')) return expectedText;
  const tripId = world.tripId || world.currentTripId || world.createdTripId || null;
  return expectedText
    .replace(/\{tripNumber\}/g, tripId ?? '{tripNumber}')
    .replace(/\{transactionId\}/g, world.transactionId ?? '{transactionId}')
    .replace(/\{sid\}/g, world.sid ?? '{sid}');
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

// Partial-match wording: captures any request whose type contains the given keyword
When("I capture the {string} payload for request type containing {string} from Storage", async function (source, requestTypeKeyword) {
  await runPayloadValidationStep(this, "capturePayloadByRequestType", { source, requestType: requestTypeKeyword }, async () => {
    const identifiers = getScenarioIdentifiers(this);
    logger.info("Capturing payload from Storage (contains match)", { source, requestTypeKeyword, ...identifiers });

    const record = await PayloadValidation.capturePayloadByRequestType(
      this.page,
      this,
      source,
      requestTypeKeyword,
      { ...identifiers, matchMode: "contains" }
    );

    this.lastCapturedParserPayload = record;
    logger.info("Payload captured from Storage", {
      source: record.source,
      requestType: record.requestType,
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

Then(
  "the captured {string} payload for request type {string} should contain the JSON:",
  async function (source, requestType, expectedJsonBlock) {
    await runPayloadValidationStep(this, "expectCapturedPayloadContainsJsonBlock", {
      source,
      requestType,
    }, async () => {
      const resolvedBlock = resolveWorldPlaceholders(expectedJsonBlock, this);
      logger.info("Validating captured payload contains JSON with all key-value pairs", {
        source,
        requestType,
        expectedJsonLength: String(resolvedBlock || "").length,
      });

      await PayloadValidation.expectCapturedPayloadContainsJsonBlock(
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
