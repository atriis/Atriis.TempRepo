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

## Supported Step Definitions

| When | Then |
|------|------|
| Capture payloads by request type | Assert contains/not contains with operators |
| | Multi-line XML assertions (exact tag match) |
| | Multi-line JSON assertions (deep subset match) |
| | JSON path exists/contains/not contains |

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

### DON'T
- ❌ Skip the capture step before assertions
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
