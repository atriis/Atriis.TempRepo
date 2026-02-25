/*
 * Test Name: Fusion Pricing Option Segment Issue - Multi CIty
 * Description: BUG?
 * Status: Draft
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2025-10-23T05:24:58Z
 * Updated: 2025-10-23T05:48:07Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('mikeshinoda@travelfusion.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_multi_city_with_three_segments('LGW', 'MAD', 'CDG', 'BCN', 'BCN', 'LGW');
  await Flight___Click__Pricing_Options_();
  await All_the_segments_are_visible_in_Pricing_Options();
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

async function Book_a_new_trip() {
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

async function Search_flights_multi_city_with_three_segments(firstFrom, firstTo, secondFrom, secondTo, thirdFrom, thirdTo) {
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
  await page.click(".add-flight-btn");
  await page.type("#el-id-7723-354", thirdFrom);
  await page.click("#el-id-7723-339-item-0 > div");
  await page.type("#el-id-7723-355", thirdTo);
  await page.click("#el-id-7723-343-item-0 > div");
  await page.click("#el-id-7723-356");
  await page.click("#el-id-7723-347 > div > div > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("#el-id-377-356");
  await page.click("[id*='id'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Click_on_proceed_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function All_the_segments_are_visible_in_Pricing_Options() {
  await waitForText(page, "#tab-0 > div > div > p > span.selected-fare", 'Select fare');
  await waitForText(page, "#tab-0 > div > div > div > p", 'FRA - MUC');
  await page.click(".pricing-options-section > :nth-child(1) .btn--primary");
  await waitForText(page, ".select-btn", 'Select');
  //TODO Please add an assertion here
await isVisible(page, ".green");
  await waitForText(page, ".green", 'check_circle');
  await waitForText(page, ".select-btn", 'Select');
  await waitForText(page, "#tab-1 > div > div > div > p", 'MUC - BRU');
  await page.click(".select-btn");
  //TODO Please add an assertion here
await isVisible(page, "#tab-1 > div > div > div > span");
  await waitForText(page, "#tab-1 > div > div > div > span", 'check_circle');
  await waitForText(page, ".select-btn", 'Select');
  await waitForText(page, "[id='tab-2'] .origin-dest", 'FRA - GVA');
  await page.click(".select-btn");
  await waitForText(page, ".select-btn", 'Unselect');
  //TODO Please add an assertion here
await isVisible(page, "#tab-2 > div > div > div > span");
  await waitForText(page, "#tab-2 > div > div > div > span", 'check_circle');
  await page.click(".add-btn");
  await Click_on_proceed_if_there_is_a_conflict_with_previous_trip();
  await Pending_Booking___Wait_for_element_text();
}

