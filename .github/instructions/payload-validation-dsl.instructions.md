---
description: 'PayloadValidation DSL reference for capturing and asserting API payloads in Cucumber scenarios'
applyTo: '**/*.feature, **/payload_validation.steps.js, **/PayloadValidation.js'
---

# PayloadValidation DSL — Agent Reference

## Quick Overview

**PayloadValidation** is a Cucumber-integrated DSL for capturing, extracting, and validating API request/response payloads from Azure Storage in test scenarios.

**Core capabilities:**
- ✅ Capture payloads by request type from Azure Storage
- ✅ Assert payload contains/not contains with advanced expressions
- ✅ Extract blocks, split values, lookup keys, pattern match
- ✅ Multi-match fallback for parallel API traffic
- ✅ Dynamic world placeholders for runtime values (`{tripNumber}`, `{transactionId}`, `{sid}`)
- ✅ Deep JSON subset matching (arrays + object nesting)
- ✅ XML and JSON validation with loose structure matching
- ✅ Request counting — prove a supplier call was **not** re-sent

## Supported Step Definitions

| When | Then |
|------|------|
| Capture payloads by request type | Assert contains/not contains with operators |
| Capture a request **count** as a baseline | Multi-line XML assertions (exact tag match) |
| | Multi-line JSON assertions (deep subset match) |
| | JSON path exists/contains/not contains |
| | Assert no additional requests were sent since the baseline |

> **Priority rules:** Always run a capture step before assertions. Use existing step definitions; do not invent new expression types.

## Expression Operators

```gherkin
# Plain text
Then the captured "response" payload for request type "Booking" should contain "AMADEUS"

# Block extraction
And the captured "response" payload for request type "API" should contain "marker".block("tag")

# Split (XML: exact tag match; JSON: substring match)
Then the captured "block" payload for request type "API" should contain "a,b,c".split(",")[1]

# Key lookup (JSON/XML with type coercion)
Then the captured "response" payload for request type "Booking" should contain "false".onKey("isCardAuthenticationRequired")

# Pattern matching (glob)
Then the captured "block" payload for request type "API" should contain "label".map("CODE*")

# Dynamic world values (auto-resolved)
Then the captured "request" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
Then the captured "response" payload for request type "Booking" should contain "{transactionId}"

# Multi-line XML (no operators)
Then the captured "response" payload for request type "API" should contain the XML:
  """
  <tag>value</tag>
  """

# Multi-line JSON (no operators, subset match)
Then the captured "request" payload for request type "Booking" should contain the JSON:
  """
  {
    "tripId": 123,
    "status": "confirmed"
  }
  """

# JSON path assertions
Then in the captured "response" payload for request type "API", path "data.address" should exist
And in the captured "response" payload for request type "API", path "data.status" should contain "active"
```

## Key Patterns

### 1. Capture → Assert → Fallback
```gherkin
When I capture the "response" payload for request type "Amadeus4.Car_LocationList" from Storage
Then the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "MADX03"
```
Automatically scans up to 10 recent candidates if latest doesn't match.

### 2. Block Extraction → Chained Assertions
```gherkin
And the captured "response" payload for request type "API" should contain "locationCode".block("locationAddress")
Then the captured "block" payload for request type "API" should contain "MADRID".split(",")[0]
```
Extracted block becomes the new cached payload for subsequent assertions.

  > **NOTE:** When using `.block`, ensure the marker or pattern you provide is unique within the request or response payload. If the pattern appears more than once, the block extraction may select the wrong section, causing test mismatches. Always use a unique, unambiguous marker for block extraction steps.

### 3. Dynamic Values from World
```gherkin
When I complete the booking
When I capture the "request" payload for request type "Booking" from Storage
Then the captured "request" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
```
`{tripNumber}` → `world.tripId`, `{transactionId}` → `world.transactionId`, `{sid}` → `world.sid`

### 4. Full Payload Validation
```gherkin
Then the captured "request" payload for request type "Booking" should contain the JSON:
  """
  {
    "bookingItems": [{
      "productType": "car",
      "sourceSystem": "AMADEUS"
    }],
    "isTripApprovalRequired": false
  }
  """
```
Expected structure is matched as a deep subset of actual payload. If the payload is malformed or cannot be parsed as JSON, the step will throw an assertion error with a message indicating the parse failure and the request type — treat this as a contract violation and investigate the API response before adjusting the test.

### 5. Request Count — Prove a Call Was Not Re-Sent

Use when the requirement is *"the data already retrieved must be reused"*, not *"the payload must contain X"*. These two steps need **no** capture-payload step — they query the trip's request log directly.

```gherkin
# Drive the flow until the request under test has already been sent
Then the outbound leg brand cards are displayed
When I capture the number of "OfferPrice" requests sent for the trip

# Run the action that must not re-trigger it
And I add to cart from pricing options new flight flow

# Assert, anchored on a request the action is guaranteed to send
Then no additional "OfferPrice" requests should have been sent after "SelectFlight"

# And once every request of that type has been sent, that none of them repeat
And every "OfferPrice" request should reference a different "OfferID"
```

- **Baseline first.** The assertion throws `No baseline count captured for "..."` without it.
- **The capture fails fast** if that request type was never logged — the flow never reached the supplier (wrong carrier / filter / test data). Fix the setup; do not move the capture step later.
- **The anchor is mandatory and must be a real request the action sends.** It proves the new traffic has been published, so an unchanged count means *"nothing was re-sent"* and not *"nothing logged yet"*.
- **Counts are polled** until two consecutive reads agree (2 s interval, 30 s cap) because distributor logs publish asynchronously. On timeout the DSL logs a warning and uses the last read — it does not fail.
- **Trip-scoped.** The count covers the whole trip, and `world.tripId` must already be set.
- **A count alone can be fooled.** It only proves the total did not *grow* after a point — if the same entity were requested twice from the very start, the baseline would just begin higher and the assertion would still pass. Pair it with `every "..." request should reference a different "..."`, which inspects every request in the trip and fails on any repeated attribute value. Run that one last, once all such requests have been sent.

Canonical example: `tests/features/flights/flights_ib_ndc/flights_ib_ndc_non_booking/83094_ib_ndc_no_offerprice_resent_on_add_to_cart.feature`

## Scenario Identifiers (world context)

These are automatically captured during booking flow:

| Variable | Used for |
|----------|----------|
| `world.tripId` | Filter payloads from Storage (booking identifier) |
| `world.transactionId` | Filter payloads from Storage (API transaction) |
| `world.sid` | Filter payloads from Storage (session ID) |

All placeholders in Gherkin are resolved at runtime:
- `{tripNumber}` → `world.tripId`
- `{transactionId}` → `world.transactionId`
- `{sid}` → `world.sid`

## Common Use Cases

### Validate API Response Contains Expected Value
```gherkin
When I complete the booking
When I capture the "response" payload for request type "Booking" from Storage
Then the captured "response" payload for request type "Booking" should contain "Confirmed".onKey("status")
```

### Validate Nested JSON Structure
```gherkin
Then the captured "request" payload for request type "Booking" should contain the JSON:
  """
  {
    "bookingItems": [{"productType": "car", "isPassive": false}],
    "isTripApprovalRequired": false
  }
  """
```

### Extract and Assert on Block
```gherkin
When I capture the "response" payload for request type "Amadeus4.Car_LocationList" from Storage
And the captured "response" payload for request type "Amadeus4.Car_LocationList" should contain "MADX03".block("locationAddress")
Then the captured "block" payload for request type "Amadeus4.Car_LocationList" should contain "MADRID".split(",")[0]
```

### Validate with Dynamic Trip ID
```gherkin
When I complete the booking
When I capture the "request" payload for request type "Booking" from Storage
Then the captured "request" payload for request type "Booking" should contain "{tripNumber}".onKey("tripId")
Then the captured "request" payload for request type "Booking" should contain the JSON:
  """
  {
    "bookingItems": [{"productType": "car"}],
    "isNewUi": true
  }
  """
```

## Error Handling & Reporting

### Assertion Failures Show First Mismatch
```
Error: Expected JSON block not found in captured request payload for request type "Booking".
Error: At "bookingItems[0].productType": expected "car", got "cars"
```

### Missing Payload
```
Error: No captured response payload found for request type "Booking". Run a capture step first.
```

### Multi-Match Fallback
If the latest payload doesn't match, up to 10 recent candidates are tested automatically. If none match:
```
Error: Expected content not found in any of the 3 captured request payload(s) for request type "Booking".
```

## Best Practices (for agents)

### DO
- ✅ Always use existing step definitions — they handle all edge cases
- ✅ Use `.block()` for chained assertions on extracted structures
- ✅ Rely on auto-fallback for parallel traffic
- ✅ Use specific request types (e.g., "Amadeus4.Car_Sell" not "Car")
- ✅ Use `.map()` for flexible pattern matching instead of exact strings
- ✅ Use multi-line JSON for full structure validation
- ✅ Use the request-count steps for "must not be re-sent" requirements, always with an anchor

### DON'T
- ❌ Skip the capture step before assertions (content **and** request count)
- ❌ Use a request-count assertion without an anchor request that the action under test really sends
- ❌ Create new expression types
- ❌ Hardcode dynamic values — use `{tripNumber}`, `{transactionId}`, `{sid}`
- ❌ Assume order of keys in JSON
- ❌ Test Storage directly — use the DSL

## Full Documentation

See [docs/PayloadValidation.md](../../docs/PayloadValidation.md) for comprehensive reference:
- All DSL methods and their behaviors
- Fallback and multi-match logic
- Placeholder resolution details
- Extensibility patterns
- Real-world examples from production tests

## Implementation Files

- **DSL**: `src/dsl/PayloadValidation.js`
- **Step Definitions**: `tests/steps/payload_validation.steps.js`
