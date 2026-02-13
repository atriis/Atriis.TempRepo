# How to Use Loggers

## What is the Logger?

The logger is a structured logging utility that replaces `console.log` throughout the test framework. It provides:

- **Log Levels**: Filter output by importance (debug, info, warn, error)
- **Component Context**: Know which module is logging
- **Structured Data**: Machine-readable output for CI/CD
- **Environment Control**: Configure verbosity without code changes

## Quick Reference

### Import the Logger

```javascript
// With component context (recommended)
const logger = require('@utils/logger').child('FlightSearch');

// Without context
const logger = require('@utils/logger');
```

### Log Levels

```javascript
logger.debug('Low-level details', { selector: '#btn' });
logger.info('Test flow, user actions', { from: 'LON', to: 'PAR' });
logger.warn('Recoverable issues', { attempt: 2 });
logger.error('Failures, exceptions', { error: err.message });
```

### Structured Logging

```javascript
// ✅ Good - structured data
logger.info('Searching for flight', { from: 'LON', to: 'PAR' });
// Output: INFO  [FlightSearch] Searching for flight from="LON" to="PAR"

// ❌ Bad - string concatenation
logger.info(`Searching for flight from ${from} to ${to}`);
```

## Environment Configuration

Control logger behavior via environment variables:

| Variable | Values | Description |
|----------|--------|-------------|
| **LOG_LEVEL** | `debug`, `info`, `warn`, `error`, `none` | Minimum level to display |
| **LOG_FORMAT** | `pretty`, `json` | Output format |

### Local Development

```bash
# .env
LOG_LEVEL=debug    # Show all logs
LOG_FORMAT=pretty  # Colored, human-readable
```

**Output**:
```
DEBUG 09:15:23 [FlightSearch] Starting search from="LON" to="PAR"
INFO  09:15:24 [FlightResults] Flight results loaded count=15
```

### CI/CD

```yaml
# .github/workflows/test-suite.yml
env:
  LOG_LEVEL: info    # Hide debug noise
  LOG_FORMAT: json   # Machine-parseable
```

**Output**:
```json
{"timestamp":"2026-02-13T09:15:23Z","level":"INFO","component":"FlightSearch","message":"Flight results loaded","count":15}
```

### Disable All Logs

```bash
LOG_LEVEL=none  # Silent mode (test results only)
```

## Usage by Layer

### Step Definitions (tests/steps/)

**Use `info` for test flow visibility**:

```javascript
const { When } = require("@cucumber/cucumber");
const { FlightSearch } = require("@dsl");
const logger = require('@utils/logger').child('FlightSearch');

When("I search for a flight from {string} to {string}", async function (from, to) {
  logger.info('Searching for flight', { from, to });
  await FlightSearch.searchFlightOneWay(this.page, { from, to });
});
```

### Hooks (tests/support/hooks.js)

**Use `info` for setup/teardown visibility**:

```javascript
const logger = require('@utils/logger').child('Hooks');

Before(async function (testCase) {
  logger.info('Logging in', { provider, userKey });
  await App.loginAs(this.page, user);
  logger.info('Setup complete');
});
```

### DSL Layer (src/dsl/)

**Use `debug` sparingly - only for complex debugging**:

```javascript
const logger = require('@utils/logger').child('FlightSearch-DSL');

const FlightSearch = {
  async searchFlightOneWay(page, route) {
    logger.debug('Starting search', { route });
    // ... implementation
  }
};
```

### Page Objects (src/pages/)

**❌ Do NOT add logging to Page Objects**  
Page Objects should remain silent. Log in DSL or Step Definitions instead.

## Practical Examples

### Example 1: Step Definition with Context

```javascript
const { When } = require("@cucumber/cucumber");
const { CarSearch } = require("@dsl");
const logger = require('@utils/logger').child('CarSearch');

When("I search for a car at {string}", async function (place) {
  logger.info('Searching for car', { place });
  await CarSearch.searchCarByPlace(this.page, place);
});
```

### Example 2: Error Handling

```javascript
const logger = require('@utils/logger').child('Checkout');

When("I complete the booking", async function () {
  logger.info('Completing booking');
  try {
    await Checkout.bookAndFinalize(this.page);
  } catch (error) {
    logger.error('Booking failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});
```

### Example 3: Debugging Complex Flow

```javascript
const logger = require('@utils/logger').child('FlightResults');

When("I filter results by carrier {string}", async function (carrier) {
  logger.info('Filtering results by carrier', { carrier });
  
  // Store carrier context
  this.currentCarrier = carrier;
  
  await flightResultsPage.typeInSearchFlightFilter(carrier);
  await this.page.waitForTimeout(1000);
  
  logger.debug('Filter applied, waiting for results to stabilize');
});
```

## Best Practices

### ✅ DO

- **Use structured context**: `logger.info('Message', { key: value })`
- **Choose appropriate levels**: `info` for flow, `debug` for details
- **Add component context**: `logger.child('ComponentName')`
- **Log before actions**: Helps trace test execution
- **Use meaningful messages**: Describe what's happening

### ❌ DON'T

- **Don't use string concatenation**: `logger.info(\`Message ${value}\`)`
- **Don't log in Page Objects**: Keep them silent
- **Don't overlog**: Avoid logging every single action
- **Don't mix console.log and logger**: Use logger consistently
- **Don't log sensitive data**: Passwords, tokens, PII

## When to Use Each Log Level

| Level | Usage | Examples |
|-------|-------|----------|
| **debug** | Implementation details, DOM selectors, waits | Element clicks, waits, selector matches |
| **info** | Test flow, user actions, important state changes | Searching, adding to cart, logging in |
| **warn** | Recoverable issues, fallbacks, retries | Retry attempts, fallback paths |
| **error** | Test failures, exceptions, critical issues | Login failures, timeout errors |

## Filtering Logs

### By Component

```bash
# Local terminal
npm test 2>&1 | grep FlightSearch

# In test output - you'll see:
INFO  [FlightSearch] Searching for flight from="LON" to="PAR"
DEBUG [FlightSearch] Route resolved from="LON" to="PAR"
```

### By Level

```bash
# Show only errors
LOG_LEVEL=error npm test

# Show info and above (info, warn, error)
LOG_LEVEL=info npm test

# Show everything
LOG_LEVEL=debug npm test
```

## FAQ

**Q: What log level should I use for CI?**  
A: `info` - shows test flow without debug noise.

**Q: Can I disable logs completely?**  
A: Yes, set `LOG_LEVEL=none`.

**Q: Should I log in every step definition?**  
A: Log important actions and flow. Skip trivial steps.

**Q: What about performance?**  
A: Negligible impact. Logger filters before formatting.

**Q: Can I use logger in Page Objects?**  
A: No. Keep Page Objects silent. Log in DSL or steps.
