# Atriis Automation

**Proof of Concept for UI Test Automation using Playwright + Node.js**

Atriis Automation is a POC framework showcasing how an end-to-end UI test automation solution can be structured using Playwright and JavaScript, based on the TMC2.Framework structure. It demonstrates a DSL layer, Page Object Model, environment‑driven configuration, parallel execution, reporting, and CI/CD integration with GitHub Actions.

## 📚 Table of Contents

- [Project Structure](#-project-structure)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Running Tests](#-running-tests)
- [Architecture & Design](#-architecture--design)
- [Test Structure](#-test-structure)
- [Browser Lifecycle & Test Isolation](#-browser-lifecycle--test-isolation)
- [Test Categories and Traits](#-test-categories-and-traits)
- [CI/CD (GitHub Actions)](#-cicd-github-actions)
- [Debugging & Troubleshooting](#-debugging--troubleshooting)
- [Extending and Improving the Framework](#-extending-and-improving-the-framework)
- [Status / Scope](#-status--scope)

## 📂 Project Structure

```
atriis-automation/
├── src/
│   ├── config/           # Environment-driven configuration
│   ├── dsl/              # High-level domain actions (business flows)
│   ├── pages/            # Page Object Model implementations
│   ├── utils/            # Cross-cutting helpers (DOM, waits)
│   └── data/             # Shared test data (e.g., flights.json)
├── tests/
│   ├── fixtures/         # Playwright fixtures and context setup
│   ├── smoke/            # Critical smoke tests
│   └── regression/       # Comprehensive regression suites
├── .github/workflows/    # CI/CD workflows (test-suite.yml, dashboard.yml)
├── test-results/         # Test artifacts (JUnit XML, JSON)
├── playwright-report/    # Playwright HTML report
└── .env / .env.example   # Environment configuration template
```

## ✨ Key Features

- **DSL layer** for human-readable scenarios
  - *Business-focused test language that abstracts technical implementation details*
  - *Enables non-technical stakeholders to understand test scenarios*
  - *Promotes reusable, maintainable test flows*

- **Page Object Model (POM)** with centralized, maintainable selectors
  - *Encapsulates UI interactions and element selectors in dedicated classes*
  - *Provides consistent interface for page interactions across all tests*
  - *Enables easy maintenance when UI changes occur*

- **Playwright Fixtures** for reusable, preconfigured contexts (e.g., logged-in users) to simplify test setup and enforce isolation
  - *Automatic context isolation ensures tests don't interfere with each other*
  - *Pre-configured user sessions eliminate repetitive login steps*
  - *Supports multiple user types (Amadeus, Sabre, RateHawk) for comprehensive testing*

- **Environment‑driven configuration** (no secrets committed)
  - *Secure credential management through environment variables*
  - *Support for multiple environments (dev, staging, production)*
  - *Easy configuration switching without code changes*

- **Parallel execution** with Playwright projects and worker control
  - *Configurable worker count for optimal performance (2-4 parallel workers)*
  - *Separate project configurations for smoke vs regression testing*
  - *Automatic load balancing across available system resources*

- **Reporting**: JUnit XML, JSON, and HTML report
  - *JUnit XML format for CI/CD integration and test result aggregation*
  - *Interactive HTML reports with detailed test execution timelines*
  - *JSON format for programmatic analysis and custom reporting tools*

- **CI/CD ready**: GitHub Actions workflows for smoke/regression jobs and dashboard publishing
  - *Automated test execution on push/pull request events*
  - *Artifact collection and retention for debugging failed tests*
  - *GitHub Pages integration for centralized test result dashboards*


## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18 (CI uses Node 20)
- **npm** installed

### Installation

```bash
git clone <REPOSITORY_URL>
cd atriis-automation
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill required values:

| Environment Variable | Example Value | Description |
|---------------------|---------------|-------------|
| `AUTOMATION_APP_BASEURL` | `https://ui.gtp-staging.com` | Base URL of the application |
| `AMADEUS_USER_ONE_EMAIL` | `ruimariano@amadeus.com` | Amadeus user one email |
| `AMADEUS_USER_TWO_EMAIL` | `coreytaylor@amadeusclubdubu.com` | Amadeus user two email |
| `RATEHAWK_USER_ONE_EMAIL` | `lidi@ratehawk.com` | Ratehawk user email |
| `SABRE_USER_ONE_EMAIL` | `robsoncruz@sabrecargdg.com` | Sabre user email |
| `GENERAL_PASSWORD` | `(Secret)` | Shared password for all users |

## 🎯 Running Tests

```bash
# All tests
npx playwright test

# Smoke tests
npx playwright test --project=Smoke
npx playwright test --grep "@smoke"

# Critical priority
npx playwright test --grep "priority:critical"

# Headed mode
npm run test:headed

# Debug mode
npm run test:debug

# Open HTML report
npx playwright show-report
```

## 🏗️ Architecture & Design

**Tests → DSL → Pages → Utils**

## 🧩 Test Structure

- **Projects**: Smoke & Regression
- **Fixtures**: Logged-in contexts per user
- **Tags**: @smoke, priority:critical


## 🔄 Browser Lifecycle & Test Isolation

### Playwright's Automatic Isolation Model

Playwright automatically handles browser lifecycle and test isolation without requiring manual setup or collections like traditional xUnit frameworks.

#### How It Works

**Browser Process Management**
- Shared browser processes across multiple tests for performance
- Each test gets a completely isolated browser context
- Automatic cleanup after each test (cookies, storage, sessions cleared)

**Parallel Execution**
```javascript
// playwright.config.js
workers: process.env.CI ? 2 : 4  // 2-4 parallel workers
```
- Tests run concurrently in separate worker processes
- Each worker maintains isolated browser contexts
- No cross-test interference or state leakage

**User Fixture Isolation**
```javascript
// Pre-authenticated user contexts
amadeusUserOneTest('test name', async ({ newTripPageAMADEUS_USER_ONE }) => {
  // Fresh login session for this test only
});

sabreUserOneTest('test name', async ({ newTripPageSABRE_USER_ONE }) => {
  // Completely isolated from other user sessions
});
```

#### Benefits vs Traditional Approaches

| Feature | Traditional xUnit | Playwright Model |
|---------|------------------|------------------|
| **Setup** | Manual browser lifecycle | Automatic context management |
| **Isolation** | Risk of state leakage | Guaranteed fresh contexts |
| **Performance** | Sequential or complex sharing | Parallel + optimized browser reuse |
| **Maintenance** | Collection management overhead | Simple fixture-based approach |

#### Key Advantages

✅ **Zero Configuration**: No browser lifecycle setup required  
✅ **Guaranteed Isolation**: Each test starts with clean state  
✅ **Optimal Performance**: Parallel execution with shared browser processes  
✅ **Reliable CI/CD**: No flaky tests due to state contamination  

#### When This Works Best

- **E2E Testing**: Full user journey scenarios requiring fresh sessions
- **Login-Dependent Tests**: Multiple user types with authentication requirements  
- **Parallel CI/CD**: Fast, reliable test execution in continuous integration
- **Team Development**: Consistent results across different developer environments

#### Limitations to Consider

⚠️ **Fresh Login Cost**: Each test performs complete authentication (higher execution time)  
⚠️ **No Shared State**: Tests cannot share expensive setup between them  
⚠️ **Memory Usage**: Multiple browser contexts require more system resources


## 🏷️ Test Categories and Traits

### Overview

Playwright supports native test organization through tags and filtering, allowing you to run specific test subsets without external libraries.

### Test Categories

**Smoke Tests**
- Fast, critical validation of core functionality
- Run before every deployment
- Located in `tests/smoke/`

**Regression Tests**
- Comprehensive end-to-end scenarios
- Full feature coverage testing
- Located in `tests/regression/`

### Priority Levels

- **Critical**: Must-pass tests for essential workflows
- **High**: Important functionality, not deployment-blocking
- **Medium**: Standard coverage for secondary features

### Implementation

**Adding Tags to Tests**
```javascript
// Single tag
test('[@smoke] User can login successfully', async ({ page }) => {
  // test implementation
});

// Multiple tags
test('[@smoke][priority:critical] Flight booking end-to-end', async ({ page }) => {
  // test implementation
});
```

**Running Tagged Tests**
```bash
# Run smoke tests only
npx playwright test --grep "@smoke"

# Run critical priority tests
npx playwright test --grep "priority:critical"

# Combine multiple filters
npx playwright test --grep "@smoke.*priority:critical"

# Exclude specific tags
npx playwright test --grep-invert "@slow"

# Use project-based filtering
npx playwright test --project=Smoke
```

### Benefits

✅ **Native Support**: Built into Playwright, no additional dependencies  
✅ **Flexible Filtering**: Regex-based matching supports complex combinations  
✅ **CI/CD Integration**: Easy integration with build pipelines  
✅ **Clear Organization**: Visual test categorization in code and reports

## 🔄 CI/CD (GitHub Actions)

- ✅ **Test Suite Workflow**: Runs smoke and regression tests on pushes/PRs to main
- 📦 **Artifacts**: Uploads JUnit XML, JSON, and Playwright HTML report
- 📊 **Dashboard**: Generates summary and publishes via GitHub Pages

### ⚠️ Important Note

GitHub Pages is not enabled for this repository right now.

- ✅ Test Suite workflow will run and upload artifacts successfully
- ✅ Dashboard workflow will generate the HTML dashboard and upload it as an artifact
- ❌ The final step (actions/deploy-pages) will fail until Pages is enabled

#### Next steps when access is granted

1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Re-run the dashboard workflow or trigger a new test run

After enabling Pages, the dashboard will be published at:
`https://<OWNER>.github.io/<REPO>/index.html`

## 🎛️ Test Result Artifacts

### Current Implementation

Your project automatically generates comprehensive test artifacts for debugging and analysis:

#### ✅ Screenshots
```javascript
// playwright.config.js
screenshot: 'only-on-failure'
```
- **Automatic capture** on test failures for visual debugging
- **Saved to** `test-results/` folder with timestamp and test name
- **Format**: PNG images showing exact failure state

#### ✅ Playwright Traces
```javascript
// playwright.config.js  
trace: 'retain-on-failure'
```
- **Step-by-step execution traces** for detailed investigation
- **Interactive timeline** showing actions, network requests, and DOM changes
- **View with**: `npx playwright show-trace <trace-file>`

#### ✅ Test Execution Results
```javascript
// playwright.config.js
reporter: [
  ['junit', { outputFile: 'test-results/results.xml' }],
  ['html', { outputFolder: 'playwright-report' }]
]
```
- **JUnit XML format** for CI/CD integration and reporting tools
- **Interactive HTML report** with test details, timing, and failure analysis
- **JSON results** automatically generated for programmatic access

### 📋 Artifact Coverage Status

| Artifact Type | Status | Implementation | Location |
|---------------|---------|----------------|----------|
| **Screenshots** | ✅ **Implemented** | Automatic on failure | `test-results/` |
| **Execution Traces** | ✅ **Implemented** | Playwright traces | `test-results/` |
| **Test Results** | ✅ **Implemented** | JUnit XML + HTML | `test-results/`, `playwright-report/` |
| **Coverage Reports** | ❌ **Missing** | *Not implemented* | *N/A* |
| **Retention Policies** | ❌ **Missing** | *No automatic cleanup* | *N/A* |

### 🚧 Future Enhancements

#### Code Coverage Analysis
```bash
# Planned implementation
npm install --save-dev @playwright/test c8
# Add coverage collection to playwright.config.js
# Generate coverage reports in HTML/LCOV formats
```

#### Artifact Retention Management
```bash
# Planned automation
# Smoke tests: 7-day retention
# Regression tests: 30-day retention  
# Automatic cleanup via GitHub Actions or local scripts
```

### 📖 Using Test Artifacts

```bash
# View latest HTML report
npx playwright show-report

# Open specific trace file
npx playwright show-trace test-results/trace.zip

# CI/CD integration
# JUnit XML automatically uploaded as artifact in GitHub Actions
```

**💡 Benefits**: These artifacts provide comprehensive debugging capabilities, enabling quick root cause analysis of test failures and maintaining high test reliability standards.



## 🛠️ Debugging & Troubleshooting

### Quick Debug Commands

```bash
# Visual debugging (see browser actions)
npm run test:headed

# Step-by-step debugging with DevTools
npm run test:debug

# Run specific failing test with traces
npx playwright test --trace on path/to/failing-test.spec.js

# View latest test report
npx playwright show-report
```

### Debug Modes

**Headed Mode**
- Shows browser window during test execution
- Best for: Understanding test flow and UI interactions
- Use when: Tests pass locally but fail in CI

**Debug Mode** 
- Pauses execution, opens DevTools
- Best for: Step-by-step code inspection
- Use when: Need to examine element states or network calls

**Trace Mode**
- Records detailed execution timeline
- Best for: Post-failure analysis
- Use when: Investigating flaky or intermittent failures

### Common Issues & Solutions

#### ❌ Element Not Found
```bash
# Problem: Selector doesn't match any elements
# Solution: Check Page Object Model selectors
```
- Verify selectors in `src/pages/` files
- Use browser DevTools to test CSS selectors
- Consider timing issues (element not loaded yet)

#### ⏳ Timeout Errors
```bash
# Problem: Actions or waits exceed timeout limits
# Solution: Use proper wait utilities
```
- Check `src/utils/wait.js` for available wait functions
- Increase timeout for slow operations: `{ timeout: 30000 }`
- Verify network conditions in CI environment

#### 🔑 Authentication Issues
```bash
# Problem: Login failures or session timeouts
# Solution: Verify environment configuration
```
- Check `.env` file has correct credentials
- Verify CI secrets are properly configured
- Test individual user fixtures in isolation

#### 🏃‍♂️ Flaky Tests
```bash
# Problem: Tests pass sometimes, fail other times
# Solution: Improve wait strategies
```
- Replace hard waits with dynamic waits
- Use `waitFor()` instead of `setTimeout()`
- Add retry logic for network-dependent operations

### Debugging Tools

**Screenshots**
- Automatically captured on test failure
- Located in `test-results/` folder
- Show exact UI state when test failed

**Traces**
- Interactive timeline of test execution
- View with: `npx playwright show-trace test-results/trace.zip`
- Shows network requests, console logs, and DOM changes

**Console Logs**
- Framework includes comprehensive logging
- All page actions logged with timestamps
- Check terminal output for execution details

### Environment Debugging

**Local vs CI Differences**
```bash
# Test CI configuration locally
npx playwright test --project=Smoke --workers=2

# Match CI browser settings
npx playwright test --headed=false
```

**Configuration Issues**
- Verify `playwright.config.js` settings
- Check environment variable loading
- Validate user fixture configurations

## 🔧 Extending and Improving the Framework

### Core Improvements

#### 1. Implement BasePage Pattern

**Why**: Eliminate code duplication and enforce consistent patterns across all pages.

**Benefits**:
- Consistency: All pages follow the same approach for navigation and interactions
- Maintainability: Update one method in BasePage, and all pages benefit  
- Best Practices: Enforce stable selectors and common functionality

#### 2. Improve Selector Strategy

**Current Issue**: CSS class selectors are fragile and break easily
**Solution**: Migrate to data-testid attributes

**Implementation Steps**:
1. Work with developers to add `data-testid` attributes to key elements
2. Update page objects to use `getByTestId()` instead of CSS selectors
3. Gradually replace fragile selectors with stable alternatives

#### 3. Add New Page Objects

**Process**: Create page classes that extend BasePage for new application areas

**Requirements**:
- Follow established naming conventions
- Encapsulate UI interactions in dedicated methods
- Include comprehensive console logging for debugging
- Use consistent element selector patterns

#### 4. Create New DSL Actions

**Purpose**: Build high-level business workflow methods that combine page actions

**Guidelines**:
- Implement business-focused scenarios in `src/dsl/` folder
- Combine multiple page methods into logical workflows
- Follow existing patterns for logging and error handling
- Focus on readable, maintainable test flows

### Framework Extensions

#### 6. Add New Fixtures *(Leverage Existing System)*

**Current Status**: ✅ Comprehensive user fixture system already implemented
- `amadeusUserOneTest`, `sabreUserOneTest`, `ratehawkUserOneTest` available
- Automatic context isolation and login management working

**Future Extensions**:
- Add new user roles within existing booking systems
- Create environment-specific user variations
- Extend fixture system for additional authentication scenarios

## 📌 Status / Scope
This repository is a Proof of Concept for internal reference only.