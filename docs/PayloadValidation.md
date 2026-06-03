# PayloadValidation (PayloadVerification) — Technical Survey & Documentation

---

## 1. Overview

**PayloadValidation** is a DSL module for capturing, extracting, and validating API payloads (request/response) in the Atriis Test Automation framework. It supports advanced assertions on XML/JSON payloads, block extraction, key/value checks, pattern matching, and robust fallback logic for parallel API traffic.

- **Primary Use:** Validate that API payloads (captured from Azure Storage) contain expected data at every step of the booking flow.
- **Integration Points:** Used in Cucumber step definitions (`payload_validation.steps.js`) and referenced in Gherkin feature files (see canonical example below).

---

## 2. Core Methods & Behaviors

### 2.1. `setCapturedPayload(world, source, requestType, payload, filters)`

- **Purpose:** Store a captured payload in the test context (`world`) for later assertions.
- **Parameters:**
  - `world`: Test context object (required)
  - `source`: Either "request", "response", or "block" (required)
  - `requestType`: API request type identifier (e.g., "Amadeus4.Car_LocationList")
  - `payload`: Raw payload string (XML/JSON/text)
  - `filters`: Optional object with `tripId`, `transactionId`, `sid`
- **Key Logic:** Normalizes source/requestType, builds a unique key, attaches scenario identifiers.
- **Returns:** The stored payload record containing metadata and capture timestamp.
- **Error Handling:** Throws if world is invalid or source is not one of the three allowed values.
- **Usage:** Called after fetching payloads from Azure Storage or extracting blocks.
- **Logging:** Logs payload size and captured filters for debugging.

---

### 2.2. `capturePayloadByRequestType(page, world, source, requestType, options)`

- **Purpose:** Fetch a payload from Azure Storage by source/requestType and scenario identifiers.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier. Supports `*` wildcard matching (for example, `RevalidateItenarary*` for starts-with and `*RevalidateItenarary*` for contains)
  - `options`: Object with optional `tripId`, `transactionId`, `sid`
- **Key Logic:** Calls `fetchPayloadFromAzureStorage`, stores result via `setCapturedPayload`.
- **Returns:** The stored payload record.
- **Error Handling:** Throws if Storage fetch fails or page is invalid.
- **Fallback:** None (fetches latest or all matches as needed).
- **Usage:** 
  - Step: `When I capture the "{source}" payload for request type "{requestType}" from Storage`
  - Called in step definitions to retrieve payloads from Azure Table/Blob Storage.
- **Logging:** Logs fetch request, payload size, blob name, and timestamp.

---

### 2.3. `getCapturedPayload(world, source, requestType)`

- **Purpose:** Retrieve a previously captured payload from the test context.
- **Parameters:**
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
- **Returns:** Payload record object containing payload, source, requestType, capturedAt, and filters.
- **Error Handling:** Throws descriptive error if not found (ensures pre-validation requirement).
- **Usage:** Internal to all assertion methods; ensures capture step ran first.
- **Logging:** Logs cache hit/miss and available keys if not found.

---

### 2.4. `expectCapturedPayloadContains(page, world, source, requestType, expectedText)`

- **Purpose:** Assert that the captured payload contains the expected value, supporting advanced expressions:
  - Plain text: `"foo"`
  - Block extraction: `"foo".block("tag")` — Extracts XML block by tag or JSON by key path
  - Split: `"foo,bar".split(",")` or `"foo,bar".split(",")[1]` — Splits and checks parts; for XML payloads each part must exactly match an XML tag value (case-insensitive); for JSON payloads uses substring match
  - onKey: `"value".onKey("key")` — Asserts key has specific value (JSON/XML)
  - Map: `"label".map("PATTERN*")` — Pattern/glob match (e.g., location codes)
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
  - `expectedText`: Expression string (plain text or with DSL operators)
- **Key Logic:**
  1. Parses the expression to determine assertion type
  2. Runs assertion on the latest captured payload
  3. If fast path fails, fetches up to 10 recent candidates from Storage
  4. Passes if any candidate matches
- **Fallback Logic:**
  - **When:** Latest payload assertion fails
  - **How:** Fetches all recent matching payloads for the same source/requestType/identifiers
  - **Max candidates:** 10 (configurable via `maxMatches` in Storage client)
  - **Promotion:** If a candidate matches, it becomes the new cached payload
- **Block Extraction:** If `.block()` matches, stores the matched block as a new "block" payload for chained assertions.
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Detailed errors include expression details, fast path failure reason, and fallback scan results.
- **Usage:** Step: `Then the captured "{source}" payload for request type "{requestType}" should contain "{expression}"`
- **Logging:** Logs expression parsing, fast path result, fallback scan details, and final match.

---

### 2.4.1. `expectCapturedPayloadNotContains(page, world, source, requestType, expectedText)`

- **Purpose:** Assert that the captured payload does **not** contain the expected value, supporting the same expression syntax as `expectCapturedPayloadContains(...)`:
  - Plain text: `"foo"`
  - Block expression: `"foo".block("tag")`
  - Split: `"foo,bar".split(",")` or `"foo,bar".split(",")[1]`
  - onKey: `"value".onKey("key")`
  - Map: `"label".map("PATTERN*")`
- **Parameters:** Same as `expectCapturedPayloadContains(...)`.
- **Key Logic:**
  1. Parses expression using the same parser chain as contains
  2. Applies inverse assertion semantics for each operator
  3. Uses the same fast-path + multi-match fallback strategy
- **Exact matching behavior (XML):**
  - `.split(...)` and block-source exact-value checks use exact XML tag-value comparison (case-insensitive, whitespace-normalized)
  - Substring-only matches do not satisfy exact XML checks
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Throws when unexpected content is found, including expression/operator-specific details.
- **Usage:**
  - `Then the captured "{source}" payload for request type "{requestType}" should not contain "{expression}"`
  - `Then the captured "{source}" payload for request type "{requestType}" should not contain the multiline text:`

---

### 2.5. `expectCapturedPayloadPathExists(page, world, source, requestType, path)`

- **Purpose:** Assert that a JSON path exists in the captured payload.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
  - `path`: Dot-notation JSON path (e.g., "data.address.street")
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Throws if payload is not valid JSON or path not found.
- **Usage:** Step: `Then in the captured "{source}" payload for request type "{requestType}", path "{path}" should exist`

---

### 2.6. `expectCapturedPayloadPathContains(...)` and `expectCapturedPayloadPathNotContains(...)`

- **Purpose:** Assert that a JSON path contains or does not contain a substring.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
  - `path`: Dot-notation JSON path
  - `expectedValue`: Substring to verify
- **Behavior:**
  - `expectCapturedPayloadPathContains(...)`: passes when `String(valueAtPath).includes(expectedValue)`
  - `expectCapturedPayloadPathNotContains(...)`: passes when `String(valueAtPath)` does not include `expectedValue`
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Throws if path not found or substring expectation fails.
- **Usage:**
  - `Then in the captured "{source}" payload for request type "{requestType}", path "{path}" should contain "{expectedValue}"`
  - `Then in the captured "{source}" payload for request type "{requestType}", path "{path}" should not contain "{expectedValue}"`
- **Note:** `expectCapturedPayloadPath(..., operator, ...)` still exists in the DSL for backward compatibility, but step definitions now use explicit contain/not contain steps.

---

### 2.7. `expectCapturedPayloadContainsXmlBlock(page, world, source, requestType, expectedXmlBlock)`

- **Purpose:** Assert that all key-value pairs in an XML block exist in the captured payload.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
  - `expectedXmlBlock`: Multi-line XML string with tag/value pairs
- **Key Logic:**
  1. Extracts all tag/value pairs from the expected XML
  2. Checks that each value exists somewhere in the captured payload
  3. Does not require exact structure, only presence of values
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Throws with list of missing values if any not found.
- **Usage:** Step: `Then the captured "{source}" payload for request type "{requestType}" should contain the XML:`
- **Negation Variant:** `expectCapturedPayloadNotContainsXmlBlock(...)`
  - **Usage:** `Then the captured "{source}" payload for request type "{requestType}" should not contain the XML:`
  - **Behavior:** Fails if any expected XML tag/value pair is found in the captured payload.
- **Example:**
  ```gherkin
  Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain the XML:
    """
    <locationAddress>
      <postalCode>28012</postalCode>
      <countryCode>ES</countryCode>
    </locationAddress>
    """
  ```

---

### 2.8. `expectCapturedPayloadContainsJsonBlock(page, world, source, requestType, expectedJsonBlock)`

- **Purpose:** Assert that all key-value pairs in a JSON block exist in the captured payload (deep subset match).
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
  - `expectedJsonBlock`: JSON string representing expected structure
- **Key Logic:**
  1. Parses both expected and actual payloads as JSON
  2. Recursively validates that all keys in expected exist in actual with matching values
  3. Supports nested objects and arrays with subset semantics:
     - `[]` in expected requires `[]` in actual
     - non-empty expected arrays require each expected item to match at least one item in actual
  4. Supports world placeholder resolution at step layer for JSON docstrings (e.g., `{tripNumber}`, `{transactionId}`, `{sid}`)
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Throws with detailed path information for each mismatch.
- **Usage:** Step: `Then the captured "{source}" payload for request type "{requestType}" should contain the JSON:`
- **Negation Variant:** `expectCapturedPayloadNotContainsJsonBlock(...)`
  - **Usage:** `Then the captured "{source}" payload for request type "{requestType}" should not contain the JSON:`
  - **Behavior:** Fails if any expected JSON key/value pair is found in the captured payload.
- **Example:**
  ```gherkin
  Then the captured "request" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
  Then the captured "request" payload for request type "Booking" should contain the JSON:
    """
    {
      "bookingItems": [{
        "productType": "car",
        "sourceSystem": "AMADEUS",
        "isPassive": false
      }],
      "isTripApprovalRequired": false,
      "isNewUi": true
    }
    """
  ```

---

### 2.9. `expectCapturedJsonKeyValue(world, source, requestType, key, expectedValue)`

- **Purpose:** Assert that a specific key in a JSON payload has the expected value (supports nested keys and JSON fragments).
- **Parameters:**
  - `world`: Test context object (required)
  - `source`: "request", "response", or "block"
  - `requestType`: API request type identifier
  - `key`: Dot-notation key path (e.g., "data.isCardAuthenticationRequired")
  - `expectedValue`: Expected value (any type coerced to match JSON)
- **Key Logic:**
  1. First attempts fast-path lookup in the latest captured payload
  2. If mismatch, scans up to 10 recent candidates from Storage
  3. Handles both pure JSON and JSON fragments within XML/text
  4. Type-coerces values (e.g., "true" → boolean, "-123" → number)
- **Fallback:** Multi-match scan if the latest does not match.
- **Returns:** void (assertion passes or throws)
- **Error Handling:** Throws with key path, expected value, and actual value.
- **Usage:** Internal method (used by onKey expression in `expectCapturedPayloadContains`).
- **Logging:** Logs key lookup, type coercion, and candidate scan results.

---

## 3. Helper Functions (Internal)

### 3.1. Expression Parsers

- **`parseBlockExpression(expectedText)`**: Parses `.block("tag")` syntax
- **`parseSplitExpression(expectedText)`**: Parses `.split(",")` or `.split(",")[n]` syntax
- **`parseOnKeyExpression(expectedText)`**: Parses `.onKey("key")` syntax with type coercion
- **`parseMapExpression(expectedText)`**: Parses `.map("pattern")` syntax

### 3.2. Extractors

- **`extractXmlBlocksByTag(xmlPayload, blockTag)`**: Finds all `<tag>...</tag>` blocks
- **`extractXmlKeyValuePairs(xmlString)`**: Extracts all tag/value pairs from XML
- **`extractJsonBlockByKey(jsonString, keyPath)`**: Extracts a value at a JSON key path

### 3.3. Utilities

- **`normalizeSource(source)`**: Validates and normalizes "request", "response", or "block"
- **`normalizeRequestType(requestType)`**: Trims and validates request type string
- **`normalizeForContains(value)`**: Normalizes strings for comparison (lowercase, trim, collapse whitespace)
- **`getByPath(objectValue, path)`**: Traverses nested object using dot notation
- **`getScenarioIdentifiers(world)`**: Extracts tripId, transactionId, sid from world context
- **`buildKey(source, requestType)`**: Creates storage cache key

---

## 4. Step Definitions & Gherkin Mapping

All step definitions are in `tests/steps/payload_validation.steps.js`. Here is the complete mapping:

| Gherkin Step | Method Called | Purpose |
|---|---|---|
| `When I capture the "{source}" payload for request type "{requestType}" from Storage` | `capturePayloadByRequestType()` | Fetch and cache payload |
| `Then the captured "{source}" payload for request type "{requestType}" should contain "{expression}"` | `expectCapturedPayloadContains()` | Assert payload contains text/block/split/map/onKey |
| `Then the captured "{source}" payload for request type "{requestType}" should not contain "{expression}"` | `expectCapturedPayloadNotContains()` | Assert payload does not contain text/block/split/map/onKey |
| `Then the captured "{source}" payload for request type "{requestType}" should contain the multiline text:` | `expectCapturedPayloadContains()` | Assert payload contains multi-line plain-text block (no operators) |
| `Then the captured "{source}" payload for request type "{requestType}" should not contain the multiline text:` | `expectCapturedPayloadNotContains()` | Assert payload does not contain multi-line plain-text block (no operators) |
| `Then the captured "{source}" payload for request type "{requestType}" should contain the XML:` | `expectCapturedPayloadContainsXmlBlock()` | Assert XML exists |
| `Then the captured "{source}" payload for request type "{requestType}" should not contain the XML:` | `expectCapturedPayloadNotContainsXmlBlock()` | Assert XML does not exist |
| `Then the captured "{source}" payload for request type "{requestType}" should contain the JSON:` | `expectCapturedPayloadContainsJsonBlock()` | Assert JSON exists |
| `Then the captured "{source}" payload for request type "{requestType}" should not contain the JSON:` | `expectCapturedPayloadNotContainsJsonBlock()` | Assert JSON does not exist |
| `Then in the captured "{source}" payload for request type "{requestType}", path "{path}" should exist` | `expectCapturedPayloadPathExists()` | Assert JSON path exists |
| `Then in the captured "{source}" payload for request type "{requestType}", path "{path}" should contain "{expectedValue}"` | `expectCapturedPayloadPathContains()` | Assert JSON path contains substring |
| `Then in the captured "{source}" payload for request type "{requestType}", path "{path}" should not contain "{expectedValue}"` | `expectCapturedPayloadPathNotContains()` | Assert JSON path does not contain substring |

---

## 5. Real-World Examples

### 5.1 Canonical Feature File

See [payload_amadeus_city_center_exact_location_address.feature](../tests/features/cars/payload_test/payload_amadeus_city_center_exact_location_address.feature) for a comprehensive, real-world test demonstrating all PayloadValidation assertion types and patterns.

**Key patterns demonstrated:**
1. **Block extraction** – `.block("locationAddress")` on response payload, then chain assertions on cached block
2. **Map pattern matching** – `.map("MADX*")` with glob wildcards for flexible matching
3. **Split with exact XML matching** – `.split(",")[0]` compares each part against exact XML tag values (case-insensitive, whitespace-normalized)
4. **Negative single-line expressions** – `should not contain` for both split/map/onKey operators and plain text
5. **onKey JSON/XML lookups** – `.onKey("postalCode")` finds and validates specific key values
6. **Multi-line XML** – Loose structure validation (all tag/value pairs must exist, any order)
7. **Multi-line XML negation** – `should not contain the XML:` verifies incorrect structure is absent
8. **Multi-line plain text** – Substring match across multiple lines (no operators supported)
9. **Multi-line plain text negation** – `should not contain the multiline text:` docstring verifies error patterns are absent
10. **Dynamic world placeholder on key assertions** – `"{tripNumber}".onKey("tripId")` validates runtime trip IDs safely
11. **JSON deep subset matching** – expected object/array fragments are matched against larger actual payload objects
12. **Fallback logic** – Multiple request types captured in sequence; fallback auto-scans candidates if latest doesn't match

### 5.2 Expression Examples

#### Plain Text (Single-Line with Operator Support)
```gherkin
Then the captured "request" payload for request type "Amadeus4.Car_Sell" should contain "MADX03"
Then the captured "response" payload for request type "Booking" should not contain "ERROR"
```

#### Multi-Line Plain Text (Docstring, No Operators)
```gherkin
Then the captured "response" payload for request type "Booking" should contain the multiline text:
  """
  some expected
  multi-line text
  """
Then the captured "response" payload for request type "Booking" should not contain the multiline text:
  """
  unwanted
  error message
  """
```
**Note:** Docstring format does NOT support operators (.split(), .onKey(), .map(), .block()). Use single-line format for expressions.

#### Block Extraction (Single-Line Expression with Operator)
```gherkin
And the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "MADX03".block("locationAddress")
And the captured "response" payload for request type "Amadeus4.Car_LocationList" should not contain "BCNX99".block("locationAddress")
```
Subsequent steps use `source: "block"` to assert on the extracted block.

#### Split
```gherkin
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid Atocha Rrs, Madrid, 28012, ES".split(",")
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid Atocha Rrs, Madrid, 28012, ES".split(",")[1]
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should not contain "Barcelona Sants, Barcelona, 08014, ES".split(",")
```

**XML matching:** Each split part is compared against the **exact value** of XML tags (case-insensitive, whitespace-normalized). Substrings do **not** match.

#### onKey
```gherkin
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "28012".onKey("postalCode")
Then the captured "response" payload for request type "Booking" should contain "false".onKey("isCardAuthenticationRequired")
Then the captured "response" payload for request type "Booking" should not contain "true".onKey("isCardAuthenticationRequired")
```
Supports type coercion: `"true"` → boolean, `"123"` → number, `"3.14"` → float.

#### Map (Pattern Matching)
```gherkin
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "Madrid (Railway Station)".map("MADX*")
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should not contain "Madrid (Railway Station)".map("BCN*")
```
Uses glob patterns (e.g., `MADX*`, `*ABC*`) for flexible matching.

#### Block Expression (Contain / Not Contain)
```gherkin
Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "MADX03".block("locationAddress")
Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should not contain "BCNX99".block("locationAddress")
```

---

## 6. Fallback & Multi-Match Logic

### Problem
Parallel API traffic can emit multiple payloads for the same request type within the same test scenario. For example, multiple "Booking" requests during quick successive operations (e.g., price check, then actual booking).

### Solution
**Automatic fallback with candidate scanning:**

1. **Fast path:** Attempt assertion on the latest captured payload
2. **If failed:** Fetch up to 10 recent candidates from Storage with the same source/requestType/identifiers
3. **Scan candidates:** Test each candidate until one passes
4. **Promotion:** If a match is found, promote it to the cached payload for subsequent steps
5. **Block extraction:** If a `.block()` expression matches, store the extracted block as a new "block" payload

### Fallback Triggers
- Any assertion method in `expectCapturedPayloadContains()` when the latest payload does not match
- Any JSON key lookup in `expectCapturedJsonKeyValue()` when the latest does not contain the key

### Configuration
- **Max candidates:** 10 (hardcoded, adjustable via `maxMatches` parameter to Storage client)
- **Scenario filtering:** Uses tripId, transactionId, sid to filter relevant payloads

### Error Message
If all candidates fail:
```
Expected content not found in any of the 3 captured request payload(s) for request type "Booking". 
Last error on fast path: Expected text "xyz" not found in captured request payload...
```

---

## 7. Pre-Validation & Requirements

### Must-Have Preconditions
- **World context:** All methods require a valid `world` object (test context from Cucumber step)
- **Scenario identifiers:** Tests should populate `world.tripId`, `world.transactionId`, `world.sid` for accurate payload filtering
- **Capture step first:** Must always run a capture step before asserting on a payload
- **Storage availability:** Azure Table/Blob Storage must be accessible and contain the payload data

### Scenario Identifiers Extraction & Usage

The `world` object automatically captures and stores scenario identifiers during the booking flow:

```javascript
// Automatically set during test execution
world.tripId        // Trip identifier (stored after booking creation)
world.transactionId // Transaction ID for API calls (set during API interactions)
world.sid           // Session ID (set at test start or login)
```

These identifiers are used internally by PayloadValidation to:
1. **Filter payloads** from Azure Storage — only fetch payloads matching the same tripId/transactionId/sid
2. **Multi-match fallback** — scan candidates with the same identifiers to find matching payloads
3. **Correlation** — trace test artifacts and logs to the exact booking flow

### Using World Values Directly in Gherkin Assertions

Step definitions support **inline world placeholders** inside assertion expressions. These are resolved automatically before the assertion runs — no extra steps needed.

| Placeholder | Resolved to | Example |
|---|---|---|
| `{tripNumber}` | `world.tripId` | Trip ID set after booking |
| `{transactionId}` | `world.transactionId` | Transaction ID from API interactions |
| `{sid}` | `world.sid` | Session ID from login |

**Example: Assert that a response payload contains the current trip's ID**
```gherkin
When I complete the booking
When I capture the "response" payload for request type "Booking" from Storage
Then the captured "response" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
```

**Works with all expression types:**
```gherkin
# Plain text
Then the captured "response" payload for request type "Booking" should contain "{tripNumber}"

# onKey (most common use case)
Then the captured "response" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")

# Not contain
Then the captured "response" payload for request type "Booking" should not contain "{transactionId}".onKey("wrongKey")

# Split
Then the captured "response" payload for request type "Booking" should contain "{tripNumber},{sid}".split(",")
```

**Unresolved placeholders:** If `world.tripId` is not set when the step runs, the placeholder is kept as-is (`{tripNumber}`) and the assertion will likely fail — check that the booking step ran before the assertion.

### Error Handling
- **Missing payload:** Throws `No captured {source} payload found for request type "{requestType}". Run a capture step first.`
- **Invalid source:** Throws `source must be either "request", "response" or "block", got: {source}`
- **Invalid expression:** Throws `Invalid {expression-type} expression "{expectedText}": {reason}`
- **Assertion failure:** Throws `Expected content not found in captured {source} payload for request type "{requestType}". {details}`

---

## 8. Agent Integration & Best Practices

### DO
- ✅ **Always use existing step definitions and DSL methods** — they handle all edge cases and fallback logic
- ✅ **Use block extraction for chained assertions** — e.g., `.block("locationAddress")` followed by `.split()` or `.onKey()` use it whenever possible
- ✅ **Rely on automatic fallback logic** — no need for manual retry steps
- ✅ **Use specific request types** — e.g., "Amadeus4.Car_LocationList" not just "Car_LocationList"
- ✅ **Verify scenario identifiers are set** — tripId, transactionId, sid in world context
- ✅ **Use .map() for flexible pattern matching** — better than hardcoding exact values

### DON'T
- ❌ **Skip the capture step** — assertions fail if payload not cached
- ❌ **Create new expression types** — stick to block, split, onKey, map, plain text
- ❌ **Assume latest payload is always correct** — multi-match fallback handles parallel traffic
- ❌ **Hardcode selectors in step definitions** — use DSL methods which encapsulate selectors
- ❌ **Test Storage directly** — use the PayloadValidation DSL which abstracts Storage details

### Real-World Pattern
```gherkin
# 1. Capture payload
When I capture the "response" payload for request type "SomeAPI.Request" from Storage

# 2. Extract block if needed
And the captured "response" payload for request type "SomeAPI.Request" should contain "marker".block("blockTag")

# 3. Chain assertions on block
Then the captured "block" payload for request type "SomeAPI.Request" should contain "expected".split(",")
And the captured "block" payload for request type "SomeAPI.Request" should contain "value".onKey("key")

# 4. Validate full XML/JSON if needed
Then the captured "response" payload for request type "SomeAPI.Request" should contain the XML:
  """
  <tag>
    <value>expected</value>
  </tag>
  """

# 5. Extract scenario identifiers for reporting
When I extract and store the trip identifier for reporting
And the extracted trip identifier should not be empty
```

---

## 9. Error Handling & Logging

### Logging Strategy
- **Info level:** Successful captures, multi-match fallback success, assertion matches
- **Debug level:** Expression parsing, candidate scan details, fast path attempts
- **Warn level:** Cache misses, missing payloads
- **Error level:** Assertion failures, invalid inputs, Storage errors

### Logger
- Child logger: `require("@utils/logger").child("PayloadValidation-DSL")`
- All methods include context (source, requestType, identifiers) in log metadata

### Debugging Tips
1. **Enable debug logs:** Set `DEBUG=*` or `DEBUG=PayloadValidation*` environment variable
2. **Check Storage:** Verify payloads exist in Azure Table Storage under the trip/transaction identifiers
3. **Inspect fallback scan:** Enable debug logs to see all candidate payloads tested
4. **Validate expressions:** Ensure block tags, split delimiters, and key paths are correct

---

## 10. Extensibility & Maintenance

### Adding New Step Definitions
1. Add step regex or template to `tests/steps/payload_validation.steps.js`
2. Call appropriate DSL method (`expectCapturedPayloadContains`, etc.)
3. Include logging via `logger.info()` for traceability
4. Handle both single-line (Gherkin template) and multi-line (docstring) syntax

### Adding New DSL Methods
1. Add to `src/dsl/PayloadValidation.js`
2. Follow existing pattern: validate inputs, call helper functions, log results, throw with context
3. Support fallback logic where applicable (use `fetchPayloadFromAzureStorage` with `returnAllMatches`)
4. Export via barrel export in `src/dsl/index.js`

### Adding New Expression Types
1. Create parser function (e.g., `parseMyExpression()`)
2. Add logic to `runAssertion()` inside `expectCapturedPayloadContains()`
3. Add corresponding step definition template
4. Document in this survey

### Storage Integration
- Payloads are stored in Azure Table Storage by Storage Service
- Filters (tripId, transactionId, sid) are used for querying
- Multi-match fetch is supported by `fetchPayloadFromAzureStorage()` with `returnAllMatches: true`

---

## 11. File Reference

### Implementation
- **`src/dsl/PayloadValidation.js`** — Core DSL implementation (methods, helpers, expressions)
- **`tests/steps/payload_validation.steps.js`** — Cucumber step definitions

### Examples & Documentation
- **`tests/features/cars/payload_test/payload_amadeus_city_center_exact_location_address.feature`** — Canonical feature file with real usage
- **`tests/features/cars/payload_test/PAYLOADVALIDATION_TECHNICAL_SURVEY.md`** — Detailed technical survey

### Integration Points
- **`src/utils/payloadValidationClient.js`** — Payload validation client (called by `capturePayloadByRequestType`)
- **`src/dsl/index.js`** — Barrel export for DSL modules
- **`tests/steps/app.steps.js`** — Global hooks for world context initialization

---

## 12. Quick Reference

### Supported Expression Syntax

```
Plain text:
  "foo"


Block extraction:
  "foo".block("tag")

Split (XML — exact tag value match per part, case-insensitive):
  "foo,bar".split(",")
  "foo,bar".split(",")[1]

Pattern matching:
  "label".map("PATTERN*")

Key-value (JSON/XML):
  "value".onKey("key")

Multi-line XML:
  """
  <tag>value</tag>
  """

Multi-line JSON:
  """
  {"key": "value"}
  """

JSON path:
  path: "data.address.street"
  contains: "Madrid"
  not contains: "Barcelona"
```

---

## 13. Common Scenarios & Solutions

### Scenario: Parallel Bookings Emit Multiple Payloads
**Problem:** Fast test creates booking, gets price, then books — "Booking" request appears twice.
**Solution:** Fallback logic automatically scans recent candidates and passes if any matches. No code changes needed.

### Scenario: Block Extraction Followed by Split
**Problem:** Need to extract a block, then split a field inside it.
**Solution:** Use `.block("tag")` to extract, then use `source: "block"` in next step with `.split()` expression.
**Note:** When using `.block`, ensure the marker or pattern you provide is unique within the request or response payload. If the pattern appears more than once, the block extraction may select the wrong section, causing test mismatches. Always use a unique, unambiguous marker for block extraction steps. Prefer single words without spaces or commas to minimize the risk of no matches, since block does not do the split.

### Scenario: Validating Nested JSON Path
**Problem:** Need to check deep field value in JSON payload.
**Solution:** Use `path "{path}" should contain "{value}"` or `path "{path}" should not contain "{value}"` with dot notation (e.g., "data.booking.status").

### Scenario: XML/JSON Block Must Exist Entirely
**Problem:** Need to verify all fields in a block exist.
**Solution:** Use multi-line step `should contain the XML:` or `should contain the JSON:` with full block.

---

**For further details, implementation notes, or updates, refer to:**
- `src/dsl/PayloadValidation.js` (full implementation)
- `tests/steps/payload_validation.steps.js` (step definitions)
- `tests/features/cars/payload_test/payload_amadeus_city_center_exact_location_address.feature` (real usage)

---

*This documentation is code-driven, accurate as of the current codebase snapshot, and reflects all implemented methods and patterns in the Atriis Test Automation framework.*
