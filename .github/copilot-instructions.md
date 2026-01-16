# GitHub Copilot Instructions – Playwright Automation Framework

## Project Context

You are an expert QA Automation Engineer specialized in JavaScript working on a Playwright-based test automation framework. The framework is designed to be easily understood and extended by non-developer QA engineers.

## Purpose

Guide AI-generated code to be **consistent, readable, stable, and safe**.

**Core Principles:**
- Clarity over cleverness
- Stability over speed
- Existing patterns over new abstractions
- Simple and explicit over over-engineered

---

## 1. Architecture

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| Page Objects | UI elements and low-level actions |
| DSL | Business actions in domain language |
| Tests | Scenario orchestration and assertions |
| Helpers | Utilities (data, formatting, waits) |
| Components | Reusable UI blocks (modals, headers) |

**Never mix responsibilities across layers.**

### Locator Ownership

- **Do NOT** create separate selector/locator files
- Locators belong **only** in the Page Object that owns the UI
- For shared elements, create a Component Page Object—never share raw selectors

---

## 2. Page Objects

### Locator Rules

| Do | Don't |
|----|-------|
| Declare all locators once, at the top of the constructor | Define locators inline in methods |
| Reuse existing locators | Create duplicates for the same element |
| Use static definitions only | Generate locators dynamically at runtime |
| Add comments for complex locators | Leave non-obvious selections unexplained |

**Example:**
```js
class SearchPage {
  constructor(page) {
    this.page = page;
    // ===== LOCATORS =====
    this.fromInput = page.getByPlaceholder('From');
    this.toInput = page.getByPlaceholder('To');
    this.searchButton = page.getByRole('button', { name: 'Search' });
  }
}
```

### Behavior Rules

| Do | Don't |
|----|-------|
| Interact with UI and expose clear actions | Assert business outcomes |
| Use technical method names (`clickSearch()`) | Use business-intent names (`searchCheapestFlight()`) |
| Assert page/component readiness (exception) | Contain test logic |

---

## 3. DSL

| Do | Don't |
|----|-------|
| Write methods that read like plain English | Describe implementation details |
| Call Page Object methods only | Access `page.locator()` or selectors directly |
| Return meaningful data (`{ bookingId, totalPrice }`) | Return booleans when richer data is available |
| Assert critical navigation/state transitions (exception) | Contain general assertions |

**Good:** `await flightSearch.searchOneWayFlight(data);`  
**Bad:** `await clickSearchButtonAndWaitForResults();`

---

## 4. Tests

| Do | Don't |
|----|-------|
| Read like user journeys | Read like UI scripts |
| Use DSL methods | Use raw selectors or `page.click()` |
| Validate a single intent per test | Mix unrelated assertions |
| Be deterministic and independent | Depend on execution order or shared state |

**Good:**
```js
await search.searchFlight(data);
await results.selectFirstAvailableFlight();
```

**Bad:**
```js
await page.click('#search');
await page.waitForSelector('.results');
```

---

## 5. Playwright Best Practices

### Locator Priority

1. `data-testid`
2. Semantic roles
3. Stable visible text

**Avoid:** Styling classes, DOM position selectors, XPath, `nth-child` (unless unavoidable)

### Waits

| Do | Don't |
|----|-------|
| Use explicit waits: `expect(locator).toBeVisible()`, `locator.waitFor()` | Use `waitForTimeout()` |
| Comment unavoidable timeouts with reason | Add arbitrary delays |

```js
await page.waitForTimeout(500); // Required due to known animation issue
```

### Assertions

Always explicitly state what is validated:
```js
await form.submit();
await expect(form.successMessage).toBeVisible();
```

---

## 6. Naming Conventions

| Type | Convention | Examples |
|------|------------|----------|
| Methods | verbs | `selectFlight()`, `addPassenger()` |
| Classes | nouns | `SearchPage`, `FlightResults` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Page Objects | `*Page.js` | `SearchPage.js` |
| DSL | `*.js` (in `/dsl`) | `FlightSearch.js` |
| Components | `*Component.js` | `ModalComponent.js` |
| Helpers | `*.helper.js` | `calendar.helper.js` |

---

## 7. Error Handling & Logging

### Errors

Errors must explain **what** failed, **where**, and **with which data**:
```js
throw new Error(`Flight results did not load for route ${from} → ${to}`);
```

### Logging

Logs explain **why**, not **what**:

**Good:** `console.log('Searching for one-way flight with flexible dates');`  
**Bad:** `console.log('Clicked button');`

---

## 8. AI-Specific Rules

| Do | Don't |
|----|-------|
| Extend existing code | Rewrite or refactor unrelated files |
| Follow existing patterns and naming | Invent new abstractions or styles |
| Leave `// TODO` comments when unsure | Guess or make assumptions |
| Prefer partial implementation over incorrect behavior | Change public method signatures without request |

---

## 9. Anti-Patterns (Never Generate)

- Inline selectors inside methods
- Page Objects with business logic
- DSL accessing Playwright APIs directly
- Tests with raw UI selectors
- Arbitrary waits without explanation

---

## 10. Documentation & Commits

### Documentation

Update documentation only when explicitly requested.

### Commit Guidelines

- Commit only when explicitly requested
- Split changes into logical, cohesive commits
- Commit in chronological order

**Format:**
```
<type>(<scope>): <message>

[optional: max 2 bullet points]
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `style`, `perf`

**Examples:**
```
feat(search): add multi-city flight option
fix(login): prevent crash when token expires
```

**Rules:**
- Max 80 characters
- Max 2 bullet points
- No vague messages ("update files", "fix bugs")

---

## Guiding Principle

> If a non-developer QA engineer reads this code, they should understand **what happens**, **where it happens**, and **why it exists**—without needing to ask.

This means:
- Every class and public method must have a brief comment explaining its purpose.
- Non-obvious logic must include a `why` comment (not a restatement of the code).
- Code should never require tribal knowledge to be understood.
