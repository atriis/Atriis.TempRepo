# TODO

## Working Now: 
Creating some tests with Cucumber.
Fix daily run tests.

## High Priority
- [ ] Adjust and create assertions
- [ ] Create flight multi-city flow/test
- [ ] Search about login and time
- [ ] Self-healing tests
- [ ] Dropdowns duplication code
- [ ] Share button duplication code
- [ ] Dynamic Fields Checkout Locators creation

## Medium Priority

## Low Priority
- [ ] Implement Administration (Page Object, DSL, and test sample)
- [ ] Using the prompts library and test cases from Azure, create new tests

# Automation Framework Improvement Backlog

## HIGH PRIORITY (Stability / Architecture)

- [ ] **Document all 25 waitForTimeout calls** with standard comment format: `// TIMEOUT: <reason> - <context>`
- [ ] **Audit and replace waitForTimeout** with proper waitFor conditions (start with >1000ms timeouts)
- [ ] **Create selector migration plan** for 48 nth() usages → data-test-id attributes
- [ ] **Add Cucumber smoke tests to CI** (run on every PR, currently missing)
- [ ] **Add Cucumber regression suites to CI** (hotels, rails, ground transport, manual quote)
- [ ] **Implement retry strategy** for flaky operations (network calls, third-party integrations)
- [ ] **Create SupplierRegistry pattern** to centralize supplier metadata and reduce scattered logic

## MEDIUM PRIORITY (Maintainability / Consistency)

- [ ] **Standardize DSL method signatures** (consistent param order: page, data, options)
- [ ] **Refactor complex BDD scenarios** (>12 steps) into smaller, focused tests
- [ ] **Add Background sections** to feature files for common setup (reduce duplication)
- [ ] **Create composite DSL methods** for multi-step flows (e.g., `searchAndAddToCart()`)
- [ ] **Standardize date parameter handling** across all DSL methods (use indices or date objects consistently)
- [ ] **Add timeout documentation standard** to copilot-instructions.md
- [ ] **Remove Playwright Test Runner tests** after full Cucumber migration (free up CI resources)
- [ ] **Add performance baseline tracking** to CI (capture test duration trends)

## LOW PRIORITY (Polish / Future Improvements)

- [ ] **Add visual regression testing** for critical UI flows (cart, checkout, pricing)
- [ ] **Create test data factories** for common entities (travelers, routes, bookings)
- [ ] **Add API mocking layer** for third-party services (reduce external dependencies)
- [ ] **Implement test parallelization** for Cucumber tests in CI (currently sequential)
- [ ] **Add coverage tracking** for feature coverage across suppliers
- [ ] **Create contribution guide** for non-developers adding BDD tests
- [ ] **Add logging aggregation** (export structured logs to monitoring tool)
- [ ] **Refactor FlightResultsPage** (300+ lines, split by concern: filters, pricing, selection)