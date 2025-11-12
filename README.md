# Atriis Test Automation Project

**A demonstration project exploring different Playwright test automation approaches.** Created to help the team transition from Testim.io, this project exemplifies how to test flight booking functionality using standard Playwright, a hybrid Page Object Model that combines MCP integration with standard Playwright, and pure MCP automation.

## 🎯 Project Purpose

This project was created because of the need to move away from Testim.io. It contains a basic add flight to trip flow and demonstrates Playwright, JavaScript, and MCP server usage in different configurations.

The main goal is to provide different options and approaches for testing, with clear explanations and suggestions to help the team choose the best approach for their needs. This is meant as a demonstration and learning resource to explore what's possible with modern test automation tools, not a full production framework.


## 🤖 What is MCP Server?

**MCP (Model Context Protocol)** is a smart automation layer that allows you to interact with web elements using natural language descriptions instead of complex CSS selectors or XPath expressions.

**Why we're using MCP in this project:**
- **Self-healing tests**: When UI elements change, MCP can often still find them using intelligent strategies
- **Natural language**: Write `click('login button')` instead of `click('#complex-dynamic-selector-123')`
- **Resilient automation**: Tests are less brittle when the interface changes

**Why MCP could be a good option:**
MCP makes tests more readable and maintainable, especially for a team that wants automation that's closer to how humans would describe interactions with a website. It's particularly useful when dealing with dynamic applications where traditional selectors frequently break.

## 📁 Project Structure

```
AtriisAutomation/
├── tests/                           # All test files
│   ├── gtp-flight-search.spec.js       # Standard Playwright test
│   ├── gtp-flight-search-pom.spec.js   # Hybrid POM + MCP test
│   └── gtp-flight-search-mcp-only.spec.js  # Pure MCP test
├── pages/                           # Page Object Model classes
│   ├── LoginPage.js                    # Login functionality
│   ├── MenuPage.js                     # Navigation handling
│   ├── SearchPage.js                   # Search interactions
│   ├── FlightSearchPage.js             # Flight form handling
│   └── CartPage.js                     # Booking validation
├── mcp/                            # MCP automation helper
│   └── browserHelper.js               # Natural language automation
├── test-data/                      # Test configuration and data
│   ├── config.json                     # Environment URLs
│   ├── users.json                      # Test user accounts
│   └── flights.json                    # Flight route data
├── playwright.config.js            # Playwright configuration
└── package.json                   # Dependencies and scripts
```

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Running Individual Tests

**All tests can be run in either headless or headed mode:**

**Headed mode** (shows the browser window - great for debugging and watching what happens):
```bash
# Standard Playwright test
npx playwright test tests/gtp-flight-search.spec.js --headed

# Hybrid POM + MCP test  
npx playwright test tests/gtp-flight-search-pom.spec.js --headed

# Pure MCP test
npx playwright test tests/gtp-flight-search-mcp-only.spec.js --headed
```

**Headless mode** (runs in the background without browser window - faster for automated runs):
```bash
# Standard Playwright test
npx playwright test tests/gtp-flight-search.spec.js

# Hybrid POM + MCP test  
npx playwright test tests/gtp-flight-search-pom.spec.js

# Pure MCP test
npx playwright test tests/gtp-flight-search-mcp-only.spec.js
```

### Running All Tests
```bash
npm test                 # All tests in headless mode
npm test -- --headed     # All tests in headed mode
```

## 🔍 The Three Test Approaches

### Test 1: Standard Playwright (`gtp-flight-search.spec.js`)
**What it does:** A straightforward Playwright test that directly interacts with web elements using standard selectors and some MCP helper calls.

**When to use:** 
- Simple test scenarios
- Quick prototyping
- When you want minimal abstraction

**Advantages:**
- ✅ Easy to understand and write
- ✅ Direct control over every interaction
- ✅ Good for one-off tests
- ✅ Minimal setup required

**Disadvantages:**
- ❌ Code duplication across tests
- ❌ Hard to maintain when UI changes
- ❌ No reusable components
- ❌ Mixed abstraction levels

### Test 2: Hybrid POM Standard Playwright + MCP (`gtp-flight-search-pom.spec.js`)
**What it does:** Uses the Page Object Model pattern for organization while incorporating MCP helpers for intelligent element finding and natural language interactions.

**When to use:**
- Complex applications with many pages
- Team environments requiring maintainable code
- When you need both structure and smart automation

**Advantages:**
- ✅ Highly organized and maintainable
- ✅ Reusable page components
- ✅ Smart element detection through MCP
- ✅ Good separation of concerns
- ✅ Excellent for large test suites

**Disadvantages:**
- ❌ More initial setup required
- ❌ Steeper learning curve
- ❌ Can be overkill for simple tests
- ❌ Requires understanding of both POM and MCP

### Test 3: Pure MCP (`gtp-flight-search-mcp-only.spec.js`)
**What it does:** Relies primarily on MCP (Model Context Protocol) helpers that use natural language descriptions to find and interact with web elements.

**When to use:**
- When UI elements frequently change
- Testing applications with dynamic interfaces
- When you want self-healing test capabilities

**Advantages:**
- ✅ Natural language element selection
- ✅ More resilient to UI changes
- ✅ Self-healing capabilities
- ✅ Easier to read and understand intent
- ✅ Less brittle than hardcoded selectors

**Disadvantages:**
- ❌ Less precise control
- ❌ Potential performance overhead
- ❌ May require fallback strategies
- ❌ Debugging can be more complex

## ⚖️ Approach Comparison Summary

| Aspect | Standard Playwright | Hybrid POM + MCP | Pure MCP |
|--------|-------------------|------------------|----------|
| **Setup Complexity** | Low | High | Medium |
| **Maintainability** | Low | High | Medium |
| **UI Change Resilience** | Low | Medium | High |
| **Learning Curve** | Low | High | Medium |
| **Team Collaboration** | Medium | High | Medium |
| **Performance** | High | Medium | Medium |
| **Debugging Ease** | High | Medium | Low |

## 🧪 Test Data and Configuration

The project uses JSON files for test configuration:
- **Environment URLs** (staging, dev) 
- **User accounts** for different suppliers (Amadeus, Galileo, Sabre)
- **Flight route data** (LHR→MAD, NYC→LAX, etc.)

## 📸 Screenshots and Reporting

Tests are configured to automatically capture screenshots on failure. Results and artifacts are saved in the `test-results/` folder.

## 🔮 Next Steps

**Realistic improvements based on the current project:**
- Add more products and suppliers
- Create smoke suite 
- Create additional page objects
- Add more test data

## 🎓 Learning Outcomes

This project demonstrates:
- How different test automation patterns solve different problems
- The trade-offs between simplicity and maintainability
- When to choose structure vs. flexibility
- How MCP can make tests more resilient to UI changes
- Best practices for organizing test code and data