/*
 * Test Name: 40157 -[Ground Transport][groundScope] Multiple Vehicle Types Per Search Request - P.3.2
 * Description: Clone of 63833 GroundTransport - Traveller should drive content and consultant in all cases
 * Status: Draft
 * Labels: 
 * Owner: Yael
 * Created: 2025-07-16T01:07:50Z
 * Updated: 2025-07-25T02:18:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@groundscoupe.am');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Copy_of_Copy_of_Groundscope_search__from_Specific_Address_to_Specific_Address_('LHR', 'Emirates Stadium, Hornsey Road, London, UK');
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await Back_to_Search('Salvador Carneiro');
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await Back_to_Search('Pedro Andrade');
  //TODO Please add an assertion here
await isVisible(page, ".app-no-results");
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Copy_of_Copy_of_Groundscope_search__from_Specific_Address_to_Specific_Address_(Pickup, Dropoff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[id='el-id-5649-657'] > :nth-child(2) .el-radio__label");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", Pickup);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", Dropoff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("[placeholder='Pick-up time']");
  await page.click("[id='el-id-9146-695'] .btn-apply");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2705-607 > span");
  await waitForText(page, ".details-container .is-filterable .el-select__placeholder span", 'MPV');
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

async function Back_to_Search(traveller) {
  await page.click(".blue");
  await page.click(".add-btn .material-symbols-outlined");
  await page.click(".has-text-weight-semibold");
  await page.waitFor(300);
  await page.click(".el-checkbox__inner");
  await page.waitFor(300);
  await page.click("#el-id-5649-1522");
  await page.type("#el-id-5649-1522", traveller);
  await page.click("h2");
  await waitForText(page, ".travelers-list > section:nth-of-type(2) .traveler-name", traveller);
  await page.click(".btn--primary");
}

