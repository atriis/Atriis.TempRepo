# MCP-Enhanced Playwright Flight Search Automation

A simplified test automation project that uses **natural language** to write Playwright tests through MCP (Model Context Protocol) integration.

## 🎯 What This Project Does

**Write tests like this:**
```javascript
await mcp.navigate('travel site');
await mcp.fill('departure airport', 'London LHR'); 
await mcp.fill('destination airport', 'Madrid');
await mcp.selectDate('departure date', 'December 20th');
await mcp.click('search button');
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
│   └── gtp-flight-search.spec.js    # Main flight search test
├── mcp/
│   └── browserHelper.js             # MCP magic helper functions
├── playwright.config.js             # Playwright configuration  
├── package.json                     # Dependencies
└── README.md                        # This file
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the magic flight search test:**
   ```bash
   npm run test:flight
   ```

3. **Watch the magic happen:**
   - Browser opens in headed mode
   - Test navigates using natural language
   - Fills flight search form automatically
   - Takes screenshot of results

## 🪄 The Magic Features

- ✅ **Natural Language** - Write tests like talking to a human
- ✅ **Smart Element Finding** - Automatically finds buttons/fields by description  
- ✅ **Self-Healing** - Adapts when UI changes
- ✅ **Auto-Screenshots** - Captures results automatically
- ✅ **Intelligent Waits** - No manual timeout calculations

## 🎮 Available Commands

```bash
npm run test:flight    # Run flight search test (headed mode)
npm run test          # Run all tests  
npm run test:headed   # Run all tests with browser visible
npm run test:debug    # Run tests with Playwright inspector
```

## 🎯 Test Scenarios

**Current Test:** London LHR → Madrid, December 20th (one-way)

**Easy to extend:**
```javascript
// Hotel booking test
await mcp.click('hotel tab');
await mcp.fill('destination', 'Paris');

// Trip cancellation test  
await mcp.click('my bookings');
await mcp.click('cancel trip');
```

## 🛠️ Configuration

- **Browser:** Chrome with incognito mode
- **Viewport:** 1280x720 (standard size)
- **Credentials:** Pre-configured for GTP staging

## 🎉 Perfect for AI-Driven Testing

This project is designed for prompt-based test creation. Just describe what you want to test in natural language, and the MCP helper translates it into working automation!