/*
 * Test Name: 20266 EDIT SEARCH of Ground Scope
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-05-26T02:15:03Z
 * Updated: 2025-07-16T04:13:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login("elisabete@groundscope.com");
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Groundscope_search_lhr_emirates_stadium("lhr", "london bridge");
  await waitForText(page, ".results-amount", /Showing/);
  await Groundscope___Editing_groundscope_search_from_results_page();
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await page.waitForSelector(".page-layout-main .icon-img-wrapper", {state: "visible"});
  await page.click(".flicking-camera > :nth-child(2) .icon-text");
  await Groundscope_edit_from_cart();
  await waitForText(page, ".ground-transport-list > :nth-child(1) .ground-transport-desc", /Standard/);
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await scrollTo(page, 0, 870.2222290039062);
  await waitForText(page, ".last-quote .pickup-link [target='_blank']", /LGW/);
  await Trip_Cancelation();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function Groundscope_search_lhr_emirates_stadium(pickUp, dropOff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", pickUp);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", dropOff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("[placeholder='Pick-up time']");
  await page.type("#el-id-1402-690", 'all vehicle types');
  await page.click("[id*='id'] span");
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

async function Groundscope___Editing_groundscope_search_from_results_page() {
  await page.click(".edit-search-btn");
  await page.type("#el-id-1937-3617", 'London Stansted Airport (STN), Bassingbourn Road, Stansted, United Kingdom');
  await page.click("#el-id-1937-3515-item-0 > div");
  await page.click(".search-btn");
  await waitForText(page, ".results-amount", /Showing/);
  await waitForText(page, ".location-wrpper > :nth-child(3)", /STN/);
}

async function Groundscope_edit_from_cart() {
  await page.click("[popperclass='app-autocomplete-popper ']");
  // Converting a 'drag' step has to be done manually at this time
  await page.type("[popperclass='app-autocomplete-popper ']", 'lgw');
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click(".space-below > :nth-child(1) .el-input");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click(".is-danger .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(2)");
  await page.click(".search-btn");
  await waitForText(page, ".results-amount", /Showing/);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

