/*
 * Test Name: HYBRID for 69189 GroundScoupe - validate expired trip when counter is zero
 * Description: 
 * Status: Active
 * Labels: Expiry,Transportation,hybrid,Groundscope Regression,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-10-31T05:46:45Z
 * Updated: 2026-01-20T04:30:33Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('elisabete@groundscope.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Groundscope___from_Airport_to_Specific_Address('LHR', 'London Emirates Stadium, Hornsey Road, United Kingdom');
  await Add_Groundscope_from_results_page_to_cart();
  await Hoover_and_validate_the_expire_counter();
  await Pending_booking___wait_for_element_text();
  await Navigate_to_specific_trip_and_check__Expired__status();
  await __Delete__button_is_displayed_and_click__Search_again_();
  await waitForText(page, ".el-dialog__title", 'Check fare availability...');
  await waitForText(page, "[aria-label='Check fare availability...'] .btn--secondary", /Cancel|Proceed/);
  await waitForText(page, "[class^='ml'], [class*=' ml']", /Show availability|Proceed/);
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

async function Search_Groundscope___from_Airport_to_Specific_Address(pickUp, dropOff) {
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_Groundscope_from_results_page_to_cart() {
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await Pending_booking___wait_for_element_text();
}

async function Hoover_and_validate_the_expire_counter() {
  await page.hover(".app-columns .material-symbols-outlined");
  await page.waitForSelector(".fs14", {state: "visible"});
  await waitForText(page, ".fs14", /Your session is valid for /);
  await waitForText(page, ".fs14", / from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability./);
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function Close_tab___Choose_relevant_tab_in_context() {
  await close_tab();
}

async function Navigate_to_specific_trip_and_check__Expired__status() {
  await Close_tab___Choose_relevant_tab_in_context();
  await page.goto('https://ui.gtp-staging.com/trips/3606578/cart');
  await waitForText(page, ".app-columns [class^='is-flex-gap'], [class*=' is-flex-gap']", 'Expired');
}

async function __Delete__button_is_displayed_and_click__Search_again_() {
  await waitForText(page, ".btn--secondary", 'Remove quote');
  await waitForText(page, "[class^='px'], [class*=' px']", 'Search again');
  await page.click("[class^='px'], [class*=' px']");
}

