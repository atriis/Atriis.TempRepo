/*
 * Test Name: 66963 Evolvi - Stations are displayed in journey 'More Details'
 * Description: 
 * Status: Active
 * Labels: Rail,Evolvi,Regression,results,more details,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-09-10T02:23:47Z
 * Updated: 2025-09-11T09:34:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('elisabete@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi____One_way_search_lwith_parameters_('LDS', 'DON');
  await close_mandatory_notification();
  await Journey_details_is_displayed_in_results__More_Details_();
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
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

async function UK_Rail__Evolvi____One_way_search_lwith_parameters_(from, to) {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", from);
  await sendSpecialCharacter(page, "#el-id-7815-174", 'Tab');
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", to);
  await sendSpecialCharacter(page, "#el-id-7815-175", 'Tab');
  await page.click("[placeholder='Pick-up date']");
  await page.dblclick("[id='el-id-5703-1150'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-5703-1150'] tbody > :nth-child(4) > :nth-child(5)");
  await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  //TODO Please add an assertion here
await isVisible(page, "[data-track='evolvi-search-split-ticket'] .el-checkbox__inner");
  await page.click(".btn--primary");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Journey_details_is_displayed_in_results__More_Details_() {
  await waitForText(page, ".results-header > :nth-child(2) .title-container h3", 'Outbound');
  await waitForText(page, ".results-header > :nth-child(2) .trains-info-container > :nth-child(1) [class^='mr'], [class*=' mr']", 'Direct');
  await page.click(".results-header > :nth-child(2) .trains-info-container > :nth-child(1) [draggable='true']");
  await waitForText(page, "tbody > :nth-child(1) .station-cell", 'Leeds');
  await waitForText(page, "tbody > :nth-child(3) .station-cell", 'Doncaster');
  await waitForText(page, "tbody > :nth-child(1) > :nth-child(6)", 'TRAIN');
}

