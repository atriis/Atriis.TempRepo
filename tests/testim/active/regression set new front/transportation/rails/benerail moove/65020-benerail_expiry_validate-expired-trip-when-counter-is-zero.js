/*
 * Test Name: 65020 Benerail > expiry - validate expired trip when counter is zero
 * Description: 
 * Status: Active
 * Labels: Rail,Expiry,Benerail Moove Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-08-01T12:45:30Z
 * Updated: 2026-01-21T09:49:09Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('pmac@bene.ral');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_one_way('BEBMI', 'NLABK');
  await Add_Benerail_one_way_from_search_results_to_cart();
  await Pending_booking___wait_for_element_text();
  await Hoover_and_validate_the_expire_counter();
  await Navigate_to_specific_trip_and_check__Expired__status();
  await __Delete__button_is_displayed_and_click__Search_again_();
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

async function Hoover_and_validate_the_expire_counter() {
  await page.hover(".app-columns .material-symbols-outlined");
  await waitForText(page, ".timed-quote-badge > :nth-child(2)", new RegExp(/^(?:0\d|1\d):[0-5]\d$|^20:00$/));
  await page.waitForSelector(".fs14", {state: "visible"});
  await waitForText(page, ".fs14", /Your session is valid for /);
  await waitForText(page, ".fs14", / from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability./);
  await waitForText(page, ".fs14", new RegExp(/^(?:0\d|1\d):[0-5]\d$|^20:00$/));
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
  await page.goto('https://ui.gtp-staging.com/trips/3524463/cart');
  await waitForText(page, ".app-columns [class^='is-flex-gap'], [class*=' is-flex-gap']", 'Expired');
}

async function __Delete__button_is_displayed_and_click__Search_again_() {
  await waitForText(page, ".btn--secondary", 'Remove quote');
  await waitForText(page, "[class^='px'], [class*=' px']", 'Search again');
  await page.click("[class^='px'], [class*=' px']");
  await waitForText(page, ".page-container > :nth-child(2)", /train to Amsterdam Amstel/);
  await waitForText(page, ".page-container > :nth-child(2)", /NL/);
  await waitForText(page, ".page-container > :nth-child(2)", /NLABK/);
}

