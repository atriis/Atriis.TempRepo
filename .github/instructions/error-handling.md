---
applyTo: entire project
description: Error handling standards for utilities, DSL, and page objects to ensure consistent, debuggable test failures.
---

# Error Handling Guidelines

## Principles

1. **Fail fast with context** – Throw immediately with details
2. **Descriptive messages** – Explain what's wrong, actual vs expected, how to fix
3. **Layer-appropriate** – Different validation levels per layer
4. **No silent failures** – Never return null/undefined without explanation

## Validation by Layer

### Utilities (`src/utils/`)
**Always validate**: Type, null/undefined, range, format

```javascript
// ✅ GOOD
function extractNumber(context, selector, index = 0) {
  if (!context) throw new Error('context (page or frame) is required');
  if (!selector || typeof selector !== 'string') {
    throw new Error('selector must be a non-empty string');
  }
  if (typeof index !== 'number' || index < 0) {
    throw new Error(`index must be >= 0, got ${index}`);
  }
  // ... logic
}

// ❌ BAD: No validation
function extractNumber(context, selector, index) {
  return context.locator(selector).nth(index).textContent();
}
```

### DSL (`src/dsl/`)
**Validate**: `page` parameter, business rules (nights >= 1, valid enums)

```javascript
// ✅ GOOD
async searchHotelByNights(page, where, { nights = 1 } = {}) {
  if (!page) throw new Error('page is required');
  if (nights < 1) throw new Error(`nights must be >= 1, got ${nights}`);
  // ... orchestrate
}

// ✅ GOOD: Safe variant for optional flows
async cancelTripSafely(page) {
  try {
    await cartPage.cancelTrip();
    return { cancelled: true };
  } catch (error) {
    return { cancelled: false, error: error?.message };
  }
}
```

### Page Objects (`src/pages/`)
**Validate**: Dynamic selector parameters only. Let Playwright handle waits/timeouts.

```javascript
// ✅ GOOD
async selectVehicleType(vehicleType) {
  if (!vehicleType) throw new Error('vehicleType is required');
  await this.page.locator(SELECTORS.TYPE_FIELD).fill(vehicleType);
}

// ❌ BAD: Catching Playwright errors loses context
async clickElement() {
  try {
    await this.page.click(selector);
  } catch (error) {
    console.log("Failed"); // ❌ Don't do this
  }
}

## Error Message Quality

**Include**: What failed, actual value, expected value, how to fix

```javascript
// ✅ GOOD
throw new Error(`nights must be >= 1, got ${nights}`);
throw new Error(`Route "${key}" not found. Available: ${keys.join(', ')}`);

// ❌ BAD  
throw new Error("Invalid input");  // Too vague
return null;  // Silent failure
```

## Common Patterns

**Validate after defaults:**
```javascript
function select({ startIndex = 0, endIndex = null } = {}) {
  if (startIndex < 0) throw new Error(`startIndex must be >= 0, got ${startIndex}`);
  if (endIndex !== null && endIndex < 0) throw new Error(`endIndex must be >= 0, got ${endIndex}`);
}
```

**Race conditions:**
```javascript
try {
  await Promise.race([option1.waitFor(...), option2.waitFor(...)]);
} catch (error) {
  throw new Error(`Neither option1 nor option2 appeared. Original: ${error.message}`);
}
```

**Lookups:**
```javascript
if (!config[key]) {
  throw new Error(`"${key}" not found. Available: ${Object.keys(config).join(', ')}`);
}
```

## Quick Reference

| Scenario | Pattern |
|----------|---------|
| Required param | `if (!param) throw new Error('param is required')` |
| Type check | `if (typeof x !== 'string') throw new Error(\`must be string, got ${typeof x}\`)` |
| Range check | `if (x < 0) throw new Error(\`must be >= 0, got ${x}\`)` |
| Not found | `throw new Error(\`"${key}" not found. Available: ${keys}\`)` |
| Safe variant | `try { ... } catch (e) { return { success: false, error: e.message } }` |
| Playwright timeout | Let it bubble (don't catch) |
