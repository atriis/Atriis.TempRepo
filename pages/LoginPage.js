const { McpBrowserHelper } = require('../mcp/browserHelper');
const config = require('../test-data/config.json');
const users = require('../test-data/users.json');

class LoginPage {
  constructor(page) {
    this.page = page;
    this.page.mcp = new McpBrowserHelper(page);
  }

  /**
   * Navigate to the specified environment
   * @param {string} environment - 'staging' or 'dev'
   */
  async navigate(environment = 'staging') {
    console.log(`Navigating to ${environment} environment`);
    const url = environment === 'dev' ? config.devURL : config.stagingURL;
    await this.page.goto(url);
    await this.page.mcp.waitFor('page to load');
    console.log(`Successfully navigated to ${environment}`);
  }

  /**
   * Fill login credentials
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async fillCredentials(email, password) {
    console.log('Fill login credentials');
    await this.page.mcp.fill('email', email);
    await this.page.mcp.fill('password', password);
  }

  /**
   * Click the login button
   */
  async clickLogin() {
    console.log('Click login button');
    await this.page.mcp.click('login button');
    await this.page.mcp.waitFor('3');
  }

  /**
   * Complete login process
   * @param {string} userType - Company type ('amadeus', 'galileo', 'sabre')
   * @param {string} userName - User name ('userOne', 'userTwo')
   */
  async login(userType = 'amadeus', userName = 'userOne') {
    const email = users[userType][userName];
    const password = users.sharedPassword;
    await this.fillCredentials(email, password);
    await this.clickLogin();
  }
}

module.exports = LoginPage;