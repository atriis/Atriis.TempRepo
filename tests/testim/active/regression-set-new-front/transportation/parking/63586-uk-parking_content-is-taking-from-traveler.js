/*
 * Test Name: 63586 UK Parking - Content is taking from traveler
 * Description: 
 * Status: Active
 * Labels: UK Parking,Regression,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-06-19T07:30:41Z
 * Updated: 2025-12-10T12:05:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('park@ing.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click("[id='tab-parking'] p");
  await search_UK_parking_by_airport('LHR');
  await waitForText(page, ".sort-txt", 'Sort by');
  await page.click("body > :nth-child(2) ul > li:nth-of-type(1) a");
  await add_guest_as_prime_with_UG();
  await waitForText(page, "h3", 'No results found');
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

async function search_UK_parking_by_airport(airport) {
  await page.click("[id='tab-parking'] p");
  await page.click("[placeholder='Search UK Airport']");
  await page.type("[placeholder='Search UK Airport']", airport);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='Parking from']");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[id*='id']");
  await page.click("[aria-describedby='el-id-2948-33'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2918-2124 > span");
  await page.click("[id*='id']");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[id*='id']");
  await page.click("[id*='id'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3026-174 > span");
  await page.click("#pane-parking > h4");
  await page.click(".btn--primary");
}

async function add_guest_as_prime_with_UG() {
  await page.click(".add-btn .material-symbols-outlined");
  await page.click(".has-text-weight-semibold");
  await waitForText(page, ".checkbox-label", /Use as primary/);
  await page.click(".el-checkbox__inner");
  await page.click(".add-guest-btn");
  await page.click("#el-id-3607-260");
  await page.type("#el-id-3607-260", 'lll');
  await page.click("#el-id-3607-262");
  await page.type("#el-id-3607-262", 'vvv');
  await page.click("[name='email']");
  await page.type("[name='email']", 'vvv@vvv.vvv');
  await page.click(".el-radio-group > :nth-child(2) .el-radio__inner");
  await page.click(".copy-settings-container [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-3607-605", 'evolvi');
  await page.click("#el-id-3607-519 > span");
  await page.click("[class^='mb'], [class*=' mb'] .el-select__placeholder");
  await page.click("#el-id-1836-233 > span");
  await page.click(".add-guest-btn");
  await waitForText(page, ".travelers-list > :nth-child(1) .traveler-name", 'Lll Vvv');
  await page.click(".btn--primary");
}

