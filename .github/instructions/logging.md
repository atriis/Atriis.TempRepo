---
applyTo: entire project
description: Structured logging guidelines for test visibility and debugging.
---

# Logging Guidelines

## Principles

1. **Structured over strings** – Use `logger.info('msg', { key: value })` not string concatenation
2. **Layer-appropriate** – Step definitions and hooks log, Page Objects stay silent
3. **Right level** – `info` for flow, `debug` for details, `warn`/`error` for issues
4. **Component context** – Always use `logger.child('ComponentName')`

## Log Levels

| Level | When | Examples |
|-------|------|----------|
| `debug` | Low-level details | Selector details, wait confirmations |
| `info` | Test flow, actions | Searching, adding to cart, login |
| `warn` | Recoverable issues | Retries, fallback paths |
| `error` | Failures | Login failed, timeout errors |

## Usage by Layer

### Step Definitions (`tests/steps/`)
**Use `info` for test flow visibility**

```javascript
const logger = require('@utils/logger').child('FlightSearch');

When("I search for a flight from {string} to {string}", async function (from, to) {
  logger.info('Searching for flight', { from, to });
  await FlightSearch.searchFlightOneWay(this.page, { from, to });
});
```

### Hooks (`tests/support/hooks.js`)
**Use `info` for setup/teardown**

```javascript
const logger = require('@utils/logger').child('Hooks');

Before(async function (testCase) {
  logger.info('Logging in', { provider, userKey });
  await App.loginAs(this.page, user);
  logger.info('Setup complete');
});
```

### DSL (`src/dsl/`)
**Use `debug` sparingly - only for complex flows**

```javascript
const logger = require('@utils/logger').child('FlightSearch-DSL');

async searchFlightOneWay(page, route) {
  logger.debug('Starting search', { route });
  // ... implementation
}
```

### Page Objects (`src/pages/`)
**❌ Never log in Page Objects** – Keep them silent

## Structured Logging

```javascript
// ✅ GOOD - structured data
logger.info('Searching for flight', { from: 'LON', to: 'PAR' });
// Output: INFO [FlightSearch] Searching for flight from="LON" to="PAR"

// ❌ BAD - string concatenation
logger.info(`Searching for flight from ${from} to ${to}`);
```

## Environment Control

| Variable | Values | Use |
|----------|--------|-----|
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error`, `none` | Filter by level |
| `LOG_FORMAT` | `pretty`, `json` | Output format |

**Local:**
```bash
LOG_LEVEL=debug    # Show all
LOG_FORMAT=pretty  # Colored output
```

**CI/CD:**
```bash
LOG_LEVEL=info     # Hide debug noise
LOG_FORMAT=json    # Machine-readable
```

## Best Practices

### ✅ DO
- Use structured context: `{ key: value }`
- Add component context: `.child('ComponentName')`
- Log before actions
- Choose appropriate level

### ❌ DON'T
- Use string concatenation
- Log in Page Objects
- Overlog every action
- Mix `console.log` and logger
- Log sensitive data (passwords, tokens)

## Quick Reference

```javascript
// Import with context
const logger = require('@utils/logger').child('MyComponent');

// Log with structure
logger.info('User action', { param1, param2 });
logger.debug('Implementation detail', { selector });
logger.warn('Recoverable issue', { attempt: 2 });
logger.error('Failure', { error: err.message });

// Error handling
try {
  await someAction();
} catch (error) {
  logger.error('Action failed', { error: error.message, stack: error.stack });
  throw error;
}
```
