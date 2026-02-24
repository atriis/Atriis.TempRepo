/*
 * Test Name: 62890 Transferz - Validate elements position on price section
 * Description: 
 * Status: Active
 * Labels: Transferz Regression,search,Cart,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-06-02T04:30:47Z
 * Updated: 2025-10-13T05:56:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('betoribeiro@transferz.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Groundscope_search___changing_pick_up_time('LHR', 'Emirates Stadium, Hornsey Road, London, UK');
  await waitForText(page, ".sort-txt", 'Sort by');
  await Validate_content();
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

async function Groundscope_search___changing_pick_up_time(Pickup, Dropoff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", Pickup);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", Dropoff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("#el-id-9034-552");
  await page.click("[name='hours'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-964-561 > span");
  await page.waitFor(1000);
  await page.click("[id*='id'] span");
  await waitForText(page, "#el-id-9873-552", '05:00');
  await page.type("#el-id-9201-657", 'all v');
  await page.click("#el-id-9201-607 > span");
  await page.waitFor(1000);
  await page.click(".details-container > :nth-child(2) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6660-916 > span");
  await page.click(".ground-transport-search-content");
  await page.click(".ground-transport-search-content");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper ']");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.click(".search-btn");
}

async function Validate_content() {
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
  // Converting a 'css-prop-validation' step has to be done manually at this time
}

