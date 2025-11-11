# MCP-Enhanced Playwright Flight Search Automation

A sophisticated test automation project that uses **natural language** to write Playwright tests through MCP (Model Context Protocol) integration with **Page Object Model** architecture.

## 🎯 What This Project Does

**Write tests like this:**
```javascript
await loginPage.navigate('staging');
await loginPage.login('amadeus', 'userOne');
await searchPage.addTravellerImTheTraveller();
await flightSearchPage.fillOrigin('LHR');
await searchPage.clickSearchButton();
```

**Instead of this:**
```javascript
await page.goto('https://ui.gtp-staging.com/');
await page.waitForSelector('div.welcome.center > h1', { timeout: 10000 });
await page.fill('input[placeholder*="From"]', 'London LHR');
// ... 50+ lines of CSS selectors
```

## 📁 Project Structure

```
AtriisAutomation/
├── tests/
│   ├── gtp-flight-search.spec.js         # Original MCP test
│   └── gtp-flight-search-pom.spec.js     # Page Object Model test
├── pages/
│   ├── LoginPage.js                      # Login functionality
│   ├── MenuPage.js                       # Main menu navigation
│   ├── SearchPage.js                     # Search and traveller functions
│   ├── FlightSearchPage.js               # Flight form filling
│   └── CartPage.js                       # Cart and booking validation
├── test-data/
│   ├── config.json                       # Environment URLs
│   ├── users.json                        # User credentials by company
│   └── flights.json                      # Flight test data
├── mcp/
│   └── browserHelper.js                  # MCP magic helper functions
├── playwright.config.js                  # Playwright configuration
└── package.json                          # Dependencies and scripts
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run tests by environment:**
   ```bash
   # Staging (default)
   npm run test:staging:headed
   
   # Dev environment
   npm run test:dev:headed
   
   # Page Object Model test
   npm run test:pom
   ```

3. **Available test scripts:**
   ```bash
   npm run test                    # All tests headless
   npm run test:headed            # All tests with browser
   npm run test:flight            # Original flight test
   npm run test:pom               # Page Object Model test
   npm run test:staging           # Staging environment
   npm run test:dev               # Dev environment
   npm run test:debug             # Debug mode
   ```

## 🌍 Environment Configuration

**Switch environments easily:**
```bash
# PowerShell
$env:TEST_ENV = "dev"; npm test

# Command line
TEST_ENV=dev npm test
```

**Supported environments:**
- `staging` (default): https://gtp.staging.amadeus.com
- `dev`: https://ui-dev.gtp-staging.com/

## 👥 Multi-Company User Support

**User structure in `test-data/users.json`:**
```json
{
  "amadeus": { "userOne": "ruimariano@amadeus.com" },
  "galileo": { "userOne": "beatrizpamplonacorp@galileo.com" },
  "sabre": { "userOne": "robsoncruz@sabrecargdg.com" },
  "sharedPassword": "NextLevelAtriis25!"
}
```

**Usage in tests:**
```javascript
await loginPage.login('amadeus', 'userOne');
await loginPage.login('galileo', 'userOne');
await loginPage.login('sabre', 'userOne');
```

## ✈️ Flight Test Data

**Configurable flight routes in `test-data/flights.json`:**
```json
{
  "routes": {
    "lhrToMad": { "origin": "LHR", "destination": "MAD" },
    "nycToLax": { "origin": "NYC", "destination": "LAX" },
    "parToLon": { "origin": "CDG", "destination": "LHR" }
  },
  "defaultRoute": "lhrToMad"
}
```

## 🪄 The Magic Features

- ✅ **Page Object Model** - Maintainable and scalable test architecture
- ✅ **Natural Language MCP** - Write tests like talking to a human
- ✅ **Multi-Environment** - Easy staging/dev switching
- ✅ **Multi-Company Users** - Test with different user types
- ✅ **Smart Element Finding** - Automatically finds buttons/fields by description
- ✅ **Self-Healing** - Adapts when UI changes
- ✅ **Auto-Screenshots** - Captures results automatically
- ✅ **Intelligent Waits** - No manual timeout calculations

## 🎯 Test Scenarios

**Current Tests:**
- **Original Test:** Direct MCP automation (London LHR → Madrid)
- **POM Test:** Page Object Model architecture (configurable routes)

**Easy to extend:**
```javascript
// Different route test
const testRoute = flightData.routes.nycToLax;
await flightSearchPage.fillOrigin(testRoute.origin);

// Different user test
await loginPage.login('galileo', 'userOne');

// Different environment
await loginPage.navigate('dev');
```

## 🛠️ Configuration

- **Browser:** Chrome with incognito mode
- **Viewport:** Maximized window (1920x1080)
- **Timeout:** 2 minutes per test
- **Screenshots:** On failure + end of successful tests

## 📊 Architecture Benefits

**Page Object Model provides:**
- 🔧 **Maintainability:** Changes in UI only affect page objects
- 🎯 **Reusability:** Page methods used across multiple tests
- 📖 **Readability:** Tests read like business workflows
- 🧪 **Testability:** Easy to mock and unit test page objects
- 📈 **Scalability:** Simple to add new pages and tests

## 🎉 Perfect for AI-Driven Testing

This project combines the power of **MCP natural language automation** with **robust Page Object architecture**. Just describe what you want to test, and the framework handles the rest!