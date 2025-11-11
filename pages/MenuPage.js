class MenuPage {
  constructor(page) {
    this.page = page;
    // Ensure MCP is initialized
    if (!this.page.mcp) {
      const { McpBrowserHelper } = require('../mcp/browserHelper');
      this.page.mcp = new McpBrowserHelper(page);
    }
  }

  /**
   * Click 'Book a New Trip' and wait for new tab to load
   */
  async bookANewTrip() {
    console.log("Click 'Book a new trip'");
    await this.page.mcp.click('Book a New Trip');

    console.log("Wait for new tab to load");
    await this.page.mcp.waitFor('page to load');
    await this.page.mcp.waitFor('2');
  }
}

module.exports = MenuPage;