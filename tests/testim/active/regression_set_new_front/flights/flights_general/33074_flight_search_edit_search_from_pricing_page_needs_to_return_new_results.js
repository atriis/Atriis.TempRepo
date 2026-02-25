/*
 * Test Name: 33074 Flight search - Edit search from pricing page needs to return new results
 * Description: 
 * Status: Active
 * Labels: Regression,CR7,No Amadeus Hotel Book,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-07-07T11:58:27Z
 * Updated: 2025-09-14T08:25:27Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip_by_schedule("lisbon", "berlin");
  await Flight___Results___Wait_for__Select__text();
  await Flight___Search_inputs_validation();
  await Select_flights_from_results__by_schedule_search____without_clicking__Add_to_trip_();
  await Flight___Edit_search_from_results_page();
  await Flight___Search_results_validation();
  await scrollTo(page, 0, 533.3333129882812);
  await Add_to_trip_flight();
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
}

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
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

async function Search_flights_round_trip_by_schedule(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id*='id'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function Flight___Search_inputs_validation() {
  //TODO Please add an assertion here
await getText(page, ".time-info");
  await waitForText(page, ".time-info", dates);
  await waitForText(page, ".flicking-camera > :nth-child(1) .page-title", 'LIS              to              BER');
  await waitForText(page, ".flicking-camera > :nth-child(2) .page-title", 'BER              to              LIS');
}

async function Select_flights_from_results__by_schedule_search____without_clicking__Add_to_trip_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".pricing-options-container > :nth-child(1) .title", 'Your selection');
}

async function Flight___Edit_search_from_results_page() {
  await page.click(".edit-search-btn");
  await waitForText(page, "[id='el-id-5893-316'] > :nth-child(1) .el-radio__label", 'Complete trip');
  await page.click("[id='el-id-5893-316'] > :nth-child(1) .el-radio__label");
  await page.click("[placeholder='Depart Date']");
  await page.waitFor(2000);
  await page.click(".arrow-right [fill='currentColor']");
  await page.click(".is-left tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.waitFor(3000);
  await page.click(".is-left tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.waitFor(3000);
  await page.click(".search-btn");
  await waitForText(page, ".page-layout-main .is-size-6", /Showing/);
}

async function Flight___Search_results_validation() {
  //TODO Please add an assertion here
await isVisible(page, ".el-table");
  await scrollToElement(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .flight-duration > :nth-child(1)");
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .flight-duration > :nth-child(1) .flight-date", /14/);
  await scrollToElement(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1)");
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1) .flight-date", /21/);
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

