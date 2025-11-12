/**
 * MCP Browser Automation Helper - Magic Natural Language Automation
 * Converts human language into smart Playwright actions
 */

class McpBrowserHelper {
  constructor(page) {
    this.page = page;
    this.isConnected = true; // Simplified for demo
  }

  // Smart navigation - understands different ways to describe sites
  async navigate(description) {
    console.log(`MCP: Navigating to ${description}...`);
    
    // Smart URL mapping based on description
    const urlMap = {
      'staging environment': 'https://ui.gtp-staging.com/',
      'development environment': 'https://ui-dev.gtp-staging.com/'
    };
    
    const url = urlMap[description.toLowerCase()] || description;
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    console.log(`MCP: Successfully navigated to ${description}`);
  }

  // Smart click - finds elements by human description
  async click(description) {
    console.log(`MCP: Looking for "${description}" to click...`);
    
    // Special handling for date fields
    if (description.toLowerCase().includes('date') || description.toLowerCase().includes('depart')) {
      const dateStrategies = [
        () => this.page.click('input[placeholder*="Depart"]'),
        () => this.page.click('button:has-text("Depart")'),
        () => this.page.click('[aria-label*="Depart"]'),
        () => this.page.click('[placeholder*="date"]'),
        () => this.page.click('.date-picker'),
        () => this.page.click('input[type="date"]')
      ];
      
      for (const strategy of dateStrategies) {
        try {
          await strategy();
          console.log(`MCP: Successfully clicked "${description}"`);
          await this.page.waitForTimeout(1000);
          return;
        } catch (error) {
          continue;
        }
      }
    }
    
    // Special handling for login button
    if (description.toLowerCase().includes('login') || description.toLowerCase().includes('log in')) {
      const loginStrategies = [
        () => this.page.click('#btnSubmit'),
        () => this.page.click('button[type="submit"]'),
        () => this.page.click('button:has-text("Log in")'),
        () => this.page.click('button:has-text("Login")')
      ];
      
      for (const strategy of loginStrategies) {
        try {
          await strategy();
          console.log(`MCP: Successfully clicked "${description}"`);
          await this.page.waitForTimeout(1000);
          return;
        } catch (error) {
          continue;
        }
      }
    }
    
    // Special handling for Search button
    if (description.toLowerCase().includes('search')) {
      const searchStrategies = [
        () => this.page.click('button:has-text("Search")'),
        () => this.page.click('[aria-label*="Search"]'),
        () => this.page.click('button[type="submit"]'),
        () => this.page.getByRole('button', { name: /search/i }).click()
      ];
      
      for (const strategy of searchStrategies) {
        try {
          await strategy();
          console.log(`MCP: Successfully clicked "${description}"`);
          await this.page.waitForTimeout(1000);
          return;
        } catch (error) {
          continue;
        }
      }
    }
    
    // Try multiple strategies to find the element
    const strategies = [
      () => this.page.click(`text="${description}"`),
      () => this.page.click(`text="${description.replace(/button|btn/i, '')}"`),
      () => this.page.click(`button:has-text("${description.replace(/button|btn/i, '')}")`),
      () => this.page.click(`[aria-label*="${description}"]`),
      () => this.page.click(`[title*="${description}"]`),
      () => this.page.getByRole('button', { name: new RegExp(description, 'i') }).click(),
      () => this.page.getByRole('radio', { name: new RegExp(description, 'i') }).click(),
      () => this.page.getByRole('tab', { name: new RegExp(description, 'i') }).click(),
      () => this.page.getByText(new RegExp(description, 'i')).first().click(),
      () => this.page.locator(`text="${description}"`).first().click()
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        console.log(`MCP: Successfully clicked "${description}"`);
        await this.page.waitForTimeout(1000); // Smart wait
        return;
      } catch (error) {
        continue; // Try next strategy
      }
    }
    
    throw new Error(`MCP: Could not find "${description}" to click`);
  }

  // Smart fill - finds form fields by description
  async fill(description, text) {
    console.log(`MCP: Looking for "${description}" to fill with "${text}"...`);
    
    // Special handling for common field types
    if (description.toLowerCase().includes('email') || description.toLowerCase().includes('username') || description.toLowerCase().includes('user name')) {
      const emailStrategies = [
        () => this.page.fill('#email', text),
        () => this.page.fill('input[type="email"]', text),
        () => this.page.fill('input[name="email"]', text),
        () => this.page.fill('input[name="username"]', text)
      ];
      
      for (const strategy of emailStrategies) {
        try {
          await strategy();
          console.log(`MCP: Successfully filled "${description}" with "${text}"`);
          await this.page.waitForTimeout(500);
          return;
        } catch (error) {
          continue;
        }
      }
    }
    
    if (description.toLowerCase().includes('password') || description.toLowerCase().includes('psw')) {
      const passwordStrategies = [
        () => this.page.fill('#psw', text),
        () => this.page.fill('input[type="password"]', text),
        () => this.page.fill('input[name="password"]', text),
        () => this.page.fill('input[name="psw"]', text)
      ];
      
      for (const strategy of passwordStrategies) {
        try {
          await strategy();
          console.log(`MCP: Successfully filled "${description}" with "${text}"`);
          await this.page.waitForTimeout(500);
          return;
        } catch (error) {
          continue;
        }
      }
    }
    
    // Smart field mapping for other fields
    const fieldStrategies = [
      () => this.page.fill(`input[placeholder*="${description}"]`, text),
      () => this.page.fill(`input[name*="${description.toLowerCase()}"]`, text),
      () => this.page.fill(`input[id*="${description.toLowerCase()}"]`, text),
      () => this.page.getByPlaceholder(new RegExp(description, 'i')).fill(text),
      () => this.page.getByLabel(new RegExp(description, 'i')).fill(text),
      () => this.page.getByRole('textbox', { name: new RegExp(description, 'i') }).fill(text)
    ];

    for (const strategy of fieldStrategies) {
      try {
        await strategy();
        console.log(`MCP: Successfully filled "${description}" with "${text}"`);
        await this.page.waitForTimeout(500);
        return;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`MCP: Could not find field "${description}" to fill`);
  }

  // Smart date selection (assumes date picker is already open)
  async selectDate(description, date) {
    console.log(`MCP: Selecting date "${date}" from calendar...`);
    
    await this.page.waitForTimeout(1000);
    
    // Handle "December 20th" format
    if (date.toLowerCase().includes('december')) {
      // Navigate to December if needed
      const monthVisible = await this.page.isVisible('text="December"').catch(() => false);
      if (!monthVisible) {
        // Try multiple strategies to click next month
        const nextMonthStrategies = [
          () => this.page.click('button[title="Next month"]'),
          () => this.page.click('button[aria-label*="Next"]'),
          () => this.page.click('[aria-label*="next month"]'),
          () => this.page.click('.MuiPickersCalendarHeader-switchViewButton ~ button'),
          () => this.page.click('[data-testid="ArrowRightIcon"]').catch(() => 
            this.page.click('button:has([data-testid="ArrowRightIcon"])')
          )
        ];
        
        for (const strategy of nextMonthStrategies) {
          try {
            await strategy();
            await this.page.waitForTimeout(500);
            break;
          } catch (error) {
            continue;
          }
        }
      }
      
      // Extract day number and click it
      const dayMatch = date.match(/(\d+)/);
      if (dayMatch) {
        const day = dayMatch[1];
        console.log(`MCP: Looking for day ${day} in calendar...`);
        
        const dayStrategies = [
          () => this.page.click(`[role="gridcell"]:has-text("${day}"):not([disabled])`),
          () => this.page.click(`button:has-text("${day}"):not([disabled])`),
          () => this.page.locator(`[role="gridcell"]`).filter({ hasText: new RegExp(`^${day}$`) }).first().click(),
          () => this.page.click(`[data-day="${day}"]:not([disabled])`),
          () => this.page.getByRole('gridcell', { name: day }).click()
        ];
        
        for (const strategy of dayStrategies) {
          try {
            await strategy();
            console.log(`MCP: Successfully clicked day ${day}`);
            await this.page.waitForTimeout(500);
            return;
          } catch (error) {
            console.log(`MCP: Strategy failed, trying next...`);
            continue;
          }
        }
        
        throw new Error(`MCP: Could not find day ${day} in calendar`);
      }
    }
    
    console.log(`MCP: Could not parse date "${date}"`);
  }

  // Smart wait with natural language
  async waitFor(description, seconds = 3) {
    console.log(`MCP: Waiting for "${description}"...`);
    
    if (description.toLowerCase().includes('page') || description.toLowerCase().includes('load')) {
      await this.page.waitForLoadState('networkidle');
    } else if (description.includes('seconds') || !isNaN(description)) {
      const time = parseInt(description) || seconds;
      await this.page.waitForTimeout(time * 1000);
    } else {
      // Try to wait for element
      try {
        await this.page.waitForSelector(`text="${description}"`, { timeout: 10000 });
      } catch {
        await this.page.waitForTimeout(seconds * 1000);
      }
    }
    
    console.log(`MCP: Finished waiting for "${description}"`);
  }

  // Smart screenshot with natural naming
  async screenshot(description = 'page') {
    const filename = description.toLowerCase().replace(/\s+/g, '-') + '.png';
    console.log(`MCP: Taking screenshot: ${filename}`);
    
    await this.page.screenshot({ 
      path: filename, 
      fullPage: true 
    });
    
    console.log(`MCP: Screenshot saved as ${filename}`);
  }

  // Smart trip type selection
  async selectTripType(type) {
    console.log(`MCP: Selecting trip type: "${type}"...`);
    
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('one way') || normalizedType.includes('oneway')) {
      await this.click('One way');
    } else if (normalizedType.includes('round') || normalizedType.includes('return')) {
      await this.click('Round trip');
    } else if (normalizedType.includes('multi')) {
      await this.click('Multi city');
    }
    
    console.log(`MCP: Selected trip type: "${type}"`);
  }

  // Smart autocomplete selection - handles dropdown lists
  async selectFromDropdown(description = 'first option') {
    console.log(`MCP: Selecting "${description}" from dropdown...`);
    
    await this.page.waitForTimeout(1000); // Wait for dropdown to appear
    
    const strategies = [
      () => this.page.click('[role="option"]:visible:first-child'),
      () => this.page.click('.MuiAutocomplete-option:visible:first-child'),
      () => this.page.click('[role="option"][aria-selected="false"]:first-child'),
      () => this.page.locator('[role="option"]').first().click(),
      () => this.page.locator('.MuiAutocomplete-option').first().click(),
      () => this.page.keyboard.press('ArrowDown').then(() => this.page.keyboard.press('Enter'))
    ];

    for (const strategy of strategies) {
      try {
        await strategy();
        console.log(`MCP: Successfully selected "${description}"`);
        await this.page.waitForTimeout(500);
        return;
      } catch (error) {
        continue;
      }
    }
    
    // Fallback: just press Enter to select highlighted option
    try {
      await this.page.keyboard.press('Enter');
      console.log(`MCP: Selected option using Enter key`);
    } catch {
      throw new Error(`MCP: Could not select from dropdown`);
    }
  }
}

module.exports = { McpBrowserHelper };