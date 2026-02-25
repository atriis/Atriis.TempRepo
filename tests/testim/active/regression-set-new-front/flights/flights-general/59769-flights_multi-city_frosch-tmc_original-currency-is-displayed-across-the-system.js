/*
 * Test Name: 59769 Flights - Multi City - Frosch TMC - Original currency is displayed across the system
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,currency,search,Cart,additional pricing options,results,multi city,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-03-24T04:06:02Z
 * Updated: 2025-03-27T09:31:53Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('tomblink182@froschtestimcorp.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('miami, fl - international', 'boston', 'dfw', 'miami, fl - international');
  await waitForText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(3) .amount", /$/);
  await Flight___Click__Pricing_Options_();
  await waitForText(page, ".flicking-camera > :nth-child(1) .price-wrapper > :nth-child(3) .amount", /$/);
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".el-tabs [class^='mb'], [class*=' mb'] > :nth-child(3) .amount", /$/);
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function isVisible(page, selector) {
  try {
    const elementHandle = await page.$(selector);
    if(!elementHandle) {
      return false;
    }
    const elementBox = await elementHandle.boundingBox();
    return Boolean(elementBox);
  } catch(err) {
    return false;
  }
}
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function refresh_tab_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await page.reload();
}

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Search_flights_round_trip(firstFrom, firstTo, secondFrom, secondTo) {
  await page.click("[id='tab-flight'] p");
  await page.click("[id='el-id-2216-47'] > :nth-child(3) .el-radio__label");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2216-72", firstFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-73", firstTo);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-89", secondFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-90", secondTo);
  await page.click(".autocomplete-result");
  await page.click("#el-id-2216-74");
  await page.click("#el-id-2216-65 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("#el-id-2216-65 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("[id='el-id-2216-65'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-2216-91");
  await page.click("[id='el-id-2216-82'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

