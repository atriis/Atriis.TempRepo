# PayloadValidation (PayloadVerification) — Technical Survey & Documentation

---

## 1. Overview

**PayloadValidation** is a DSL module for capturing, extracting, and validating API payloads (request/response) in the Atriis Test Automation framework. It supports advanced assertions on XML/JSON payloads, block extraction, key/value checks, pattern matching, and robust fallback logic for parallel API traffic.

- **Primary Use:** Validate that API payloads (captured from Azure Storage) contain expected data at every step of the booking flow.
- **Request-count checks:** Beyond content assertions, the DSL can also count how many requests of a given type reached the supplier for the current trip — which lets a scenario prove a call was **not** re-sent, and assert that no two of those requests target the same entity (see §2.10).
- **Integration Points:** Used in Cucumber step definitions (`payload_validation.steps.js`) and referenced in Gherkin feature files (see canonical example below).
- **Global switch:** Every payload step runs through `runPayloadValidationStep()`, which no-ops (with a warning log) when `PAYLOAD_VALIDATION_ENABLED=false`. This applies to the request-count steps as well.

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

### 2.3. `capturePayloadFromPreviousCapture(page, world, source, previousSource)`

- **Purpose:** Capture the other half of the call captured just before — the response of that request, or the request of that response.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `source`: the side to capture now — `"request"` or `"response"`
  - `previousSource`: the side already captured — `"response"` or `"request"`
- **Key Logic:** Reads the most recently stored record for `previousSource` (including one promoted by an assertion's multi-match scan), takes its storage `rowKey` — a request and its response share one rowKey — and downloads the other side of that same row. The request type is inherited from the previous capture.
- **Returns:** The stored payload record, marked `pinned`.
- **Error Handling:** Throws if nothing was captured for `previousSource`, if that record has no `rowKey`, if both sources are the same, or if Storage has no counterpart for the row.
- **Fallback:** None by design — and assertions on the pinned record skip the multi-match scan too (see section 6).
- **Usage:**
  - Step: `When I capture the "{source}" payload from the previous "{previousSource}" from Storage`
  - Use when a trip sends the same request type several times and the assertion must stay on ONE of them (e.g. one post-creation Sabre `TravelItineraryAddInfoRQ` per frequent flyer carrier): capture the request, assert what identifies it, then capture its response with this step.
- **Logging:** Logs the resolved request type, rowKey, and payload size.

**Example**
```gherkin
When I capture the "request" payload for request type "TravelItineraryAddInfoRQ" from Storage
Then the captured "request" payload for request type "TravelItineraryAddInfoRQ" should contain "TravelingCarrierCode=\"AA\""
When I capture the "response" payload from the previous "request" from Storage
Then the captured "response" payload for request type "TravelItineraryAddInfoRQ" should contain "<Success timeStamp="
```

---

### 2.4. `getCapturedPayload(world, source, requestType)`

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

### 2.5. `expectCapturedPayloadContains(page, world, source, requestType, expectedText)`

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

### 2.5.1. `expectCapturedPayloadNotContains(page, world, source, requestType, expectedText)`

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

### 2.6. `expectCapturedPayloadPathExists(page, world, source, requestType, path)`

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

### 2.7. `expectCapturedPayloadPathContains(...)` and `expectCapturedPayloadPathNotContains(...)`

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

### 2.8. `expectCapturedPayloadContainsXmlBlock(page, world, source, requestType, expectedXmlBlock)`

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

### 2.9. `expectCapturedPayloadContainsJsonBlock(page, world, source, requestType, expectedJsonBlock)`

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

### 2.10. `expectCapturedJsonKeyValue(world, source, requestType, key, expectedValue)`

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

### 2.10. Request-count methods

`getRequestCount(...)` · `waitForRequestType(...)` · `captureRequestCount(...)` · `expectRequestCountUnchanged(...)` · `expectRequestCountEquals(...)` · `expectEveryRequestContainsParameter(...)` · `expectEveryRequestParameterContains(...)`

These methods do not assert on payload **content**. They count how many requests of a given type were logged for the current trip, so a scenario can prove that a supplier call was **not** repeated — for example, that pricing already retrieved is reused instead of re-requested when flights are added to the cart.

#### Why the counts are polled

Distributor logs are published asynchronously, so a single read can land mid-burst and return a count that is still growing. Counts are therefore read repeatedly until they stop changing, using these module-level constants in `src/dsl/PayloadValidation.js`:

| Constant | Value | Meaning |
|---|---|---|
| `COUNT_POLL_INTERVAL_MS` | `2000` | Delay between reads while a count is settling |
| `COUNT_STABLE_READS` | `2` | Identical consecutive reads required before a count is trusted |
| `COUNT_SETTLE_TIMEOUT_MS` | `30000` | Give-up time for settling — logs a **warning** and uses the last read; it does **not** fail the step |
| `ANCHOR_TIMEOUT_MS` | `60000` | Give-up time while waiting for the anchor request type to appear |

#### 2.10.1. `getRequestCount(world, requestType)`

- **Purpose:** Return how many distributor requests of the given type were logged for the current trip.
- **Parameters:**
  - `world`: Test context object (required)
  - `requestType`: API request type identifier (e.g. `"OfferPrice"`)
- **Key Logic:** Calls `fetchPayloadFromStorage` with `returnAllMatches: true` and `maxMatches: 1` — only one payload is downloaded because `metadata.totalMatches` already reports every match.
- **Returns:** `metadata.totalMatches` (number).
- **Error Handling:** Throws when `world.tripId` is not available, or when the request type was never logged for the trip.
- **Usage:** Internal — used by the capture/assert methods below.

#### 2.10.2. `waitForRequestType(world, requestType)`

- **Purpose:** Wait until at least one request of the given type has been logged for the trip.
- **Key Logic:** Polls `getRequestCount()` every `COUNT_POLL_INTERVAL_MS` until it succeeds or `ANCHOR_TIMEOUT_MS` elapses.
- **Returns:** The count observed once the type is present.
- **Error Handling:** Throws after `ANCHOR_TIMEOUT_MS`, including the last underlying error.
- **Usage:** Internal — used as the *anchor* in `expectRequestCountUnchanged()` to prove that the stage under test really reached the supplier before the comparison is made.

#### 2.10.3. `captureRequestCount(page, world, requestType)`

- **Purpose:** Store the current number of requests of a given type as the baseline for a later comparison.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `requestType`: API request type identifier
- **Key Logic:** Settles the count (see table above), then stores it on the world as `world.capturedRequestCounts[requestType] = { count, capturedAt }`.
- **Returns:** The baseline count.
- **Error Handling:** Fails when the type has never been sent — that means the flow under test never reached this supplier, which would make the later comparison meaningless. The error message points at the likely cause (*"Check that the selected flight is really served by the expected supplier"*).
- **Usage:** Step: `When I capture the number of "{requestType}" requests sent for the trip`

#### 2.10.4. `expectRequestCountUnchanged(page, world, requestType, anchorRequestType)`

- **Purpose:** Assert that no further request of the given type was sent since the baseline was captured.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `requestType`: The request type that must **not** grow (e.g. `"OfferPrice"`)
  - `anchorRequestType`: A request the flow is known to send **after** the baseline (e.g. `"SelectFlight"` for add to cart)
- **Key Logic:**
  1. Reads the baseline from `world.capturedRequestCounts`
  2. Waits for `anchorRequestType` via `waitForRequestType()`
  3. Settles the current count for `requestType`
  4. Asserts current count `===` baseline count
- **Why the anchor matters:** Waiting for the anchor proves that this stage's traffic has already been published, so an unchanged count means *"nothing was re-sent"* rather than *"nothing has been logged yet"*. Without it the assertion would pass for the wrong reason.
- **Returns:** void (assertion passes or throws)
- **Error Handling:**
  - No baseline captured → `No baseline count captured for "{requestType}". Run the capture step first.`
  - Count grew → failure message reports baseline, capture timestamp, current count and the number of extra requests, plus the interpretation: *"the previously retrieved pricing data was not reused"*.
- **Usage:** Step: `Then no additional "{requestType}" requests should have been sent after "{anchorRequestType}"`

#### 2.10.5. `expectRequestCountEquals(page, world, requestType, expectedCount)`

- **Purpose:** Assert an **absolute** number of requests of a given type was sent for the trip — e.g. exactly one `OfferPrice` per selected offer. No baseline needed.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `requestType`: The request type to count (e.g. `"OfferPrice"`)
  - `expectedCount`: Non-negative integer; anything else throws
- **Key Logic:** Settles the count (see table above), then asserts it equals `expectedCount`. A request type that was never logged reads as `0` instead of erroring, so `exactly 0` is a valid assertion.
- **Difference from §2.10.4:** `expectRequestCountUnchanged()` only proves the total did not *grow* after a chosen point; this one pins the total itself, so an extra call sent *before* the baseline was captured is still caught.
- **Returns:** void (assertion passes or throws)
- **Usage:** Step: `Then exactly {int} "{requestType}" requests should have been sent`
- **When to run it:** after the stage that sends those requests has finished — settling proves the number stopped moving, not that publication is complete.
- **Caveat on `exactly 0`:** it cannot tell "never sent" from "not published yet". Pair it with a step that proves the flow reached the supplier.

#### 2.10.6. `expectEveryRequestContainsParameter(page, world, requestType, parameterName)`

- **Purpose:** Assert that **every** request of a type carries a named parameter — not just the latest captured payload, which is all the `should contain` steps look at.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `requestType`: The request type to inspect (e.g. `"OfferPrice"`)
  - `parameterName`: The parameter that must be present in each request (e.g. `"OfferID"`)
- **Key Logic:**
  1. Downloads **every** matching request (`maxMatches: MAX_REQUESTS_TO_INSPECT`, raised `timeoutMs`), throwing if the set was truncated
  2. Looks for the parameter in each payload as an XML attribute (`Name="…"`), an XML tag (`<Name>`, namespace-agnostic) or a JSON key (`"Name":`) — whichever the supplier uses
  3. A `parameterName` that is not a plain identifier (e.g. `AccountCode="ABC"`) is matched as raw text instead
  4. Asserts nothing is missing; the values that were found are logged for debugging
- **Why this is not covered by §2.10.8:** the uniqueness check only *warns* when a request has no such attribute. This step is what fails the scenario.
- **Returns:** void (assertion passes or throws)
- **Error Handling:**
  - Truncated result set → explicit error naming `MAX_REQUESTS_TO_INSPECT`
  - Missing parameter → failure lists each offending request by position, timestamp and `rowKey`
- **Usage:** Step: `Then every "{requestType}" request should contain "{parameterName}"`
- **When to run it:** after every request of that type has been sent, since it inspects the whole trip.

#### 2.10.7. `expectEveryRequestParameterContains(page, world, requestType, parameterName, expectedValue, withinBlock)`

- **Purpose:** Assert that every request of a type carries the named parameter with a value **containing** `expectedValue` — the part of the value the scenario actually cares about, not the whole thing.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `requestType`: The request type to inspect (e.g. `"otaRailAvail"`)
  - `parameterName`: A **bare** tag/attribute/key name (e.g. `"DepartureDateTime"`); a whole fragment throws with an explicit message
  - `expectedValue`: Substring the value must contain (e.g. `"07:00:00"`)
- **Key Logic:**
  1. Downloads **every** matching request, throwing if the set was truncated
  2. Collects **all** occurrences of the parameter in each payload (`collectParameterValues`) — a request routinely carries one per leg or per offer
  3. A request passes when **any** occurrence contains the expected value; the other legs legitimately hold different values
  4. Failures list each request with the values that *were* found, so a wrong time is visible in the error itself
- **Scoping to one XML block (`withinBlock`):** an unscoped check passes when *any* occurrence matches, so with a round trip it cannot tell the legs apart — `07:00:00` would still be found if outbound and inbound were swapped. Passing a block tag confines the search to that block (via `extractXmlBlocksByTag()`, namespace-agnostic), and each occurrence of the block is searched separately:
  ```gherkin
  And every "otaRailAvail" request should have "DepartureDateTime" within "OriginDestinationInformation" containing "07:00:00"
  And every "otaRailAvail" request should have "DepartureDateTime" within "ReturnDateTime" containing "16:00:00"
  ```
  A payload with no such block fails with `no <ReturnDateTime> block in the payload at all`, never a silent pass.
- **Why substring:** pinning `"07:00:00"` survives test data whose date moves; asserting the full `2026-10-08T07:00:00` would break every time the booking window shifts.
- **Returns:** void (assertion passes or throws)
- **Usage:** Step: `Then every "{requestType}" request should have "{parameterName}" containing "{expectedValue}"`
- **Usage (scoped):** Step: `Then every "{requestType}" request should have "{parameterName}" within "{blockTag}" containing "{expectedValue}"`
- **When to run it:** after every request of that type has been sent, since it inspects the whole trip.

#### 2.10.8. `expectRequestAttributeValuesAreUnique(page, world, requestType, attributeName)`

- **Purpose:** Assert that no two requests of the given type carry the same value for an XML attribute — e.g. that every `OfferPrice` prices a *different* offer.
- **Parameters:**
  - `page`: Playwright page object (required)
  - `world`: Test context object (required)
  - `requestType`: The request type to inspect (e.g. `"OfferPrice"`)
  - `attributeName`: The parameter whose values must all differ (e.g. `"OfferID"`, `"offerItemId"`)
- **Key Logic:**
  1. Downloads **every** matching request (`maxMatches: MAX_REQUESTS_TO_INSPECT`, with a raised `timeoutMs`)
  2. Throws if the set was truncated — duplicates could otherwise hide in the dropped tail
  3. Extracts the parameter from each payload via `collectParameterValues()`, so it is found as an XML attribute (`OfferID="…"`), an XML tag (`<OfferID>`) or a JSON key (`"offerItemId": …`) — pass the bare name and let the DSL find its shape. A JSON array value is normalized, so `["abc"` and `abc` are the same id.
  4. Groups requests by value and asserts no value appears in more than one request
- **Why this is not covered by the count check:** a count only proves the total did not *grow* after a point. If the same offer were priced twice from the start, the baseline would simply begin higher and the count assertion would still pass. This one catches repetition wherever it happens in the flow.
- **Returns:** void (assertion passes or throws)
- **Error Handling:**
  - Truncated result set → explicit error naming `MAX_REQUESTS_TO_INSPECT`, never a silent partial check
  - Duplicates found → failure lists each repeated value with how many times it was sent and at what timestamps
  - **No request carries the parameter at all** → throws. Reporting zero duplicates from nothing would be a pass that validated nothing (this is exactly how a wrong parameter name goes unnoticed — see the Sabre NDC case in the gotchas below)
- **Usage:** Step: `Then every "{requestType}" request should reference a different "{attributeName}"`
- **When to run it:** after every request of that type has been sent, since it inspects the whole trip.

### 2.10.9 `collectParameterOccurrencesPerCall()` — generic per-call parameter counting

Generic plumbing: counts occurrences of a named parameter (e.g. `rateCategory`) in each request of a type logged for the trip. Waits for the request type and lets the count settle first, because the distributor log publishes asynchronously — reading immediately can land between the chunks of a split batch and undercount it. Attaches **no product meaning** to the count — that belongs in the DSL calling it.

- **Signature:** `(world, requestType, parameterName)` → `{ perCall: [{ entries, values }], entriesTotal }`
- **Product usage — Amadeus fare family description batching (ADO 83106):** `FlightResults.expectFareFamilyDescriptionsBatched()` / `FlightResults.expectMoreFareFamiliesDescribedThan()` in `src/dsl/FlightResults.js` call this with `parameterName = "rateCategory"` to assert the Amadeus pricing options screen batches `Fare_GetFareFamilyDescription` calls instead of sending one per fare family (chunked at the supplier cap of 6). Steps: `Then the fare family descriptions should be batched in "{requestType}" requests of at most {int} per call`, `Then more than {int} fare families should have been described in "{requestType}" requests`, both in `tests/steps/flight_nff.steps.js`, the step file for the new-flight-flow brand cards those scenarios drive.
  - **EDIFACT only.** An NDC offer is priced through a different message and never sends this request, so an NDC account makes the assertion unprovable rather than false. Use an EDIFACT-only account.
  - **What it deliberately does not assert:** an exact call count. How many calls a trip makes depends on the ladder width and the cap, not on the number of screens visited, so an exact count would be pinned to one route's live availability. The reply routing, the chunking above the cap and the partial-failure behaviour are covered deterministically by `AmadeusFlightEngineFareFamilyBatchTests` in the product repo.
  - **Measured on staging (2026-09-09).** One way LON-MAD: 1 call, 3 families `[3]`. Round trip LON-MAD: 1 call, 3 families `[3]` — one batch covered the trip even after visiting both the outbound and the inbound brand cards, so a second leg does not imply a second call. Multi city LON-MAD-CDG: 1 call, 4 families `[4]`. JFK-LAX on AA: 2 calls, 10 families `[4, 6]` — the only measured route that reaches the cap and exercises chunking.
  - **`more than {int} fare families …` is a coverage guard, not a product assertion.** The chunking branch only runs when the ladder is wider than the cap, and a route's ladder follows live availability — JFK-MIA on AA was measured at 8, then 6, then 1 family. Without the guard the scenario would keep passing while no longer exercising chunking.
  - Request type: pass `"*Fare_GetFareFamilyDescription*"`. The bare name never matches — it is logged as `Amadeus4.Fare_GetFareFamilyDescription`.
- **When to run it:** after the screen that sends the requests under test has rendered.

### 2.10.10 `waitForRequestType()` — anchoring an absence assertion

- **Signature:** `(world, requestType)` — returns the count once the type appears, throws after 60s if it never does.
- **Why it exists:** the distributor log publishes asynchronously. Asserting a request type is *absent* right after the screen renders passes because nothing has been written yet, not because the request was never made — a silent false pass. Waiting for a request type the flow definitely does make proves the log is live for this trip, and only then is an absence meaningful.
- **Usage:** Step: `When I wait until "{requestType}" requests have been sent for the trip`, then assert the absence.
- **Do not use `exactly 0 "{requestType}" requests should have been sent` for an absence.** The storage client throws when a lookup matches nothing rather than returning zero, so the step dies on a 20s `"lookup retry delay"` timeout instead of asserting. Pair the anchor with the type inventory instead:

```gherkin
When I wait until "*AMA_TravelOfferPriceRQ*" requests have been sent for the trip
And I capture all the "request" types from Storage
Then the captured "request" types do not contain request type "*Fare_GetFareFamilyDescription*"
```

Canonical example: `tests/features/flights/flights_amadeus/flights_amadeus_non_booking/84378_amadeus_ndc_offer_sends_no_fare_family_description.feature` — proves the ADO 83106 EDIFACT batching never reaches an NDC offer (TR1), whose brand info comes from `Amadeus4.NDC.AMA_TravelOfferPriceRQ (Flight Price (Brand Info))`.

#### Gotchas

- **Capture step is mandatory** — the assertion throws if no baseline exists for that request type.
- **Get the parameter name from a real payload, not from the supplier's spec.** Sabre NDC's Offer Price request carries the offer as the JSON key `offerItemId` (`{"query":[{"offerItemId":["…"]}]}`), not as `OfferID`. Asserting on `OfferID` there used to report `distinctValues=0 duplicates=0` and **pass while checking nothing**; it now throws instead, but the log line is still the quickest confirmation — `distinctValues` must match the number of requests you expect.
- **Trip-scoped, not step-scoped** — the count covers the whole trip, so the baseline must be captured at the exact point in the flow you want to measure from.
- **`world.tripId` must be set** — the count cannot be established before the trip exists.
- **Settling never fails on timeout** — it warns and uses the last read, so an unusually slow log publication could in theory yield a stale count. Check the warning in the logs when a request-count test behaves oddly.
- **Disabled by the global switch** — with `PAYLOAD_VALIDATION_ENABLED=false` both steps silently no-op, like all other payload steps.

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
| `When I capture the "{source}" payload from the previous "{previousSource}" from Storage` | `capturePayloadFromPreviousCapture()` | Fetch and cache the other half of the call captured just before (same rowKey), pinned |
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
| `When I capture the number of "{requestType}" requests sent for the trip` | `captureRequestCount()` | Store the current request count as the baseline (§2.10.3) |
| `Then no additional "{requestType}" requests should have been sent after "{anchorRequestType}"` | `expectRequestCountUnchanged()` | Assert the count did not grow since the baseline (§2.10.4) |
| `Then exactly {int} "{requestType}" requests should have been sent` | `expectRequestCountEquals()` | Assert the absolute number of requests sent for the trip (§2.10.5) |
| `Then every "{requestType}" request should contain "{parameterName}"` | `expectEveryRequestContainsParameter()` | Assert every request of that type carries the parameter (§2.10.6) |
| `Then every "{requestType}" request should have "{parameterName}" containing "{expectedValue}"` | `expectEveryRequestParameterContains()` | Assert the parameter value on every request of that type (§2.10.7) |
| `Then every "{requestType}" request should have "{parameterName}" within "{blockTag}" containing "{expectedValue}"` | `expectEveryRequestParameterContains()` | Same, but only inside the named XML block — tells round-trip legs apart (§2.10.7) |
| `Then every "{requestType}" request should reference a different "{attributeName}"` | `expectRequestAttributeValuesAreUnique()` | Assert no two requests share the same attribute value (§2.10.8) |
| `When I wait until "{requestType}" requests have been sent for the trip` | `waitForRequestType()` | Anchor an absence assertion: prove the log is publishing for this trip before claiming a request type is missing (§2.10.10) |

> Fare family description batching steps (`Then the fare family descriptions should be batched in ...`, `Then more than {int} fare families should have been described in ...`) are defined in `tests/steps/flight_nff.steps.js` and call `FlightResults.expectFareFamilyDescriptionsBatched()` / `FlightResults.expectMoreFareFamiliesDescribedThan()`, which use `collectParameterOccurrencesPerCall()` from this DSL (§2.10.9) — they're product-specific, not generic payload validation.

---

## 5. Real-World Examples

### 5.1 Canonical Feature File

See [payload_amadeus_city_center_exact_location_address.feature](../tests/features/transportation/cars/payload_test/payload_amadeus_city_center_exact_location_address.feature) for a comprehensive, real-world test demonstrating all PayloadValidation assertion types and patterns.

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

#### Request Count (No Expression)
```gherkin
When I capture the number of "OfferPrice" requests sent for the trip
# ... the part of the flow under test runs here ...
Then no additional "OfferPrice" requests should have been sent after "SelectFlight"
```
No capture-payload step is needed for these two — they query the trip's request log directly.

#### Block Expression (Contain / Not Contain)
```gherkin
Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "MADX03".block("locationAddress")
Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should not contain "BCNX99".block("locationAddress")
```

### 5.3 Request-Count Feature (Canonical)

See [83094_ib_ndc_no_offerprice_resent_on_add_to_cart.feature](../tests/features/flights/flights_ib_ndc/flights_ib_ndc_non_booking/83094_ib_ndc_no_offerprice_resent_on_add_to_cart.feature) — the reference usage of the request-count steps.

```gherkin
When I filter results by carrier "IB"
And I select the first flight result in new flight flow
Then the outbound leg brand cards are displayed
When I capture the number of "OfferPrice" requests sent for the trip
And I select the outbound first option from pricing options new flight flow
Then the inbound leg brand cards should be visible
When I select the inbound first option from pricing options new flight flow
And I add to cart from pricing options new flight flow
Then the booking status should be "Pending booking"
And no additional "OfferPrice" requests should have been sent after "SelectFlight"
```

**Pattern to copy:**

1. Drive the flow to the point where the request under test has already been sent (here: the pricing options are displayed, so `OfferPrice` has reached Iberia).
2. Capture the baseline — the step fails fast if that request type was never logged, which catches a wrong carrier or wrong test data early.
3. Run the action that must **not** re-trigger it (add to cart).
4. Assert with an anchor that is guaranteed to be sent by that action (`SelectFlight`), so the comparison happens only after the new traffic has been published.

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

### When the Fallback Is Suppressed
Payloads captured by `capturePayloadFromPreviousCapture()` are marked **pinned**: they belong to one specific call, identified by its storage rowKey. `expectCapturedPayloadContains()` and `expectCapturedPayloadNotContains()` do **not** scan candidates for a pinned payload — they fail on that payload alone, naming the rowKey.

This matters when a trip deliberately sends several semantically different calls of the same request type. Scanning siblings there would let a response assertion go green on the wrong call's response, which is exactly what pinning prevents.

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
- **`tests/features/transportation/cars/payload_test/payload_amadeus_city_center_exact_location_address.feature`** — Canonical feature file for the content assertions
- **`tests/features/flights/flights_ib_ndc/flights_ib_ndc_non_booking/83094_ib_ndc_no_offerprice_resent_on_add_to_cart.feature`** — Canonical feature file for the request-count steps
- **`.github/instructions/payload-validation-dsl.instructions.md`** — Condensed agent-facing reference

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

### Request-Count Steps (No Expression Syntax)

```gherkin
When I capture the number of "<requestType>" requests sent for the trip
Then no additional "<requestType>" requests should have been sent after "<anchorRequestType>"
```

- `<requestType>` — the call that must not be repeated (e.g. `OfferPrice`)
- `<anchorRequestType>` — a call the flow is guaranteed to send after the baseline (e.g. `SelectFlight`), used to prove the new traffic has been published before comparing

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

### Scenario: A Supplier Call Must Not Be Re-Sent
**Problem:** Need to prove that data already retrieved is reused instead of being requested again (e.g. `OfferPrice` must not be re-sent when flights are added to the cart).
**Solution:** Capture the baseline count at the point where the call has already been made, run the action, then assert with `no additional "..." requests should have been sent after "..."` using an anchor request the action is guaranteed to send. See §2.10 and §5.3.

### Scenario: Baseline Capture Fails With "no such request has been logged"
**Problem:** `When I capture the number of "X" requests sent for the trip` throws before the action even runs.
**Solution:** This is the intended fail-fast. The flow never reached that supplier — usually the wrong carrier was selected, the filter did not apply, or the trip id is not yet on the world context. Fix the scenario setup rather than moving the capture step later.

---

**For further details, implementation notes, or updates, refer to:**
- `src/dsl/PayloadValidation.js` (full implementation)
- `tests/steps/payload_validation.steps.js` (step definitions)
- `tests/features/transportation/cars/payload_test/payload_amadeus_city_center_exact_location_address.feature` (content assertions)
- `tests/features/flights/flights_ib_ndc/flights_ib_ndc_non_booking/83094_ib_ndc_no_offerprice_resent_on_add_to_cart.feature` (request-count steps)

---

*This documentation is code-driven, accurate as of the current codebase snapshot, and reflects all implemented methods and patterns in the Atriis Test Automation framework.*
