/*
 * Test Name: 46290 [Merge] Evolvi - "Please select gender" text in gender field (guest user) is displayed and error message is displayed instead of infinity spinner
 * Description: 
 * Status: Active
 * Labels: Regression,merge,guest,Rail,Evolvi,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-05-22T09:33:42Z
 * Updated: 2025-09-14T09:14:20Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('corp@Evolvi.com');
  await book_a_new_trip();
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".has-text-weight-semibold");
  await page.click(".add-guest-btn");
  await waitForText(page, "[name='gender'] .el-select__wrapper", 'Please select gender');
  await page.click(".el-dialog__header [xmlns='http://www.w3.org/2000/svg']");
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__one_way_search_lic_to_lic();
  await page.waitFor(3000);
  await close_mandatory_notification();
  await waitForText(page, ".uk-rail-results p", 'Please modify filter criteria or edit your search');
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

async function UK_Rail__Evolvi__one_way_search_lic_to_lic() {
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", 'lic');
  await page.waitFor(1000);
  await page.click("[id='el-id-2019-156-item-0'] .autocomplete-result-text");
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", 'lic');
  await page.click("[id='el-id-3128-129'] .autocomplete-result-text");
  await page.click("[placeholder='Pick-up date']");
  await page.dblclick("[id='el-id-5703-1150'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-5703-1150'] tbody > :nth-child(4) > :nth-child(5)");
  await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  await page.click(".search-btn");
}

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

