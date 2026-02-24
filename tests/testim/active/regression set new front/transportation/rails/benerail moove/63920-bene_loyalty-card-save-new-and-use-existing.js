/*
 * Test Name: 63920 Bene - Loyalty card, Save New and Use Existing
 * Description: 
 * Status: Active
 * Labels: Benerail Moove Regression,Rail,Rail loyalty numbers,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-06-26T01:43:33Z
 * Updated: 2025-10-31T12:13:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('pini@bene.ral');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_one_way('BEBMI', 'amsterdam ce');
  await Add_Benerail_one_way_from_search_results_to_cart();
  await Pending_booking___wait_for_element_text();
  await New_and_Existing_are_saved_in_trip_level();
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
async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
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

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
}

async function Search_Benerail_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("#el-id-3123-140");
  await page.click("[aria-label='Next Month']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await old2();
  await page.click(".search-btn");
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_Benerail_one_way_from_search_results_to_cart() {
  await Benerail___Results___Wait_for__Select__text();
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await Pending_booking___wait_for_element_text();
}

async function add_loyalty_card_bebe() {
  await scrollToElement(page, ".loyalty-program .is-clickable");
  await page.click(".loyalty-program .is-clickable");
  await waitForText(page, "[id='pane-overview'] .btn--primary", 'Save');
  await page.click("#tab-0");
  await page.type("#el-id-619-721", '1234566');
  await page.click("[id='pane-0'] span");
  await page.click("#el-id-619-716 > span");
  await page.click("[id='pane-overview'] .btn--primary");
  await waitForText(page, ".loyalty-program .is-clickable", 'Edit');
}

async function New_and_Existing_are_saved_in_trip_level() {
  await add_loyalty_card_bebe();
  await page.click(".loyalty-program .is-clickable");
  await waitForText(page, "#el-id-6780-733", '1234566');
  await page.click("#tab-1");
  await waitForText(page, "[id='pane-1'] span", /30838110019338123/);
  await page.click("[id='pane-overview'] .btn--primary");
  await page.click(".loyalty-program .is-clickable");
  await waitForText(page, "[id='pane-1'] span", /1234566/);
}

