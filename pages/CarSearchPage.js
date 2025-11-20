// pages/CarSearchPage.js

class CarSearchPage {
  constructor(page) {
    this.page = page;
  }

  async clickCarTab() {
    await this.page.click("#tab-car > div");
  }

  async typeCarPickupPlace(place) {
    await this.page.type("[placeholder='Search for Airport, City or Address']", place);
  }

  async clickFirstSuggestedPlace() {
    await this.page.click(".ellipsis");
  }

  async clickPickupDateField() {
    await this.page.click("#el-id-9045-275");
  }

  async clickPickupCalendarNextMonthArrow() {
    await this.page.click(
      "[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']"
    );
  }

  async selectDefaultPickupDate() {
    await this.page.click(
      "[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text"
    );
  }

  async clickDropoffDateField() {
    await this.page.click("#el-id-9045-278");
  }

  async selectDefaultDropoffDate() {
    await this.page.click(
      "[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text"
    );
  }

  async typePickupTime(time) {
    await this.page.type("#el-id-9330-775", time);
  }

  async confirmPickupTimeWithEnter() {
    await sendSpecialCharacter(this.page, "#el-id-9330-775", "Enter");
  }

  async typeDropoffTime(time) {
    await this.page.type("#el-id-9330-810", time);
  }

  async confirmDropoffTimeWithEnter() {
    await sendSpecialCharacter(this.page, "#el-id-9330-810", "Enter");
  }
}

module.exports = CarSearchPage;
