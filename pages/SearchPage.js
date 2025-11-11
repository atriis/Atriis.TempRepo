class SearchPage {
  constructor(page) {
    this.page = page;
    // Ensure MCP is initialized
    if (!this.page.mcp) {
      const { McpBrowserHelper } = require('../mcp/browserHelper');
      this.page.mcp = new McpBrowserHelper(page);
    }
  }

  /**
   * Add traveller and select 'I'm the traveller'
   */
  async addTravellerImTheTraveller() {
    console.log("Click 'Add traveller' button");
    await this.page.mcp.click('Add traveller');

    console.log("Select 'I'm the traveller'");
    await this.page.mcp.click('I\'m the traveller');
  }

  /**
   * Click the search button and wait for results
   */
  async clickSearchButton() {
    console.log("Click Search button");
    await this.page.locator('button.search-btn').click();
    await this.page.mcp.waitFor('5');
  }
}

module.exports = SearchPage;