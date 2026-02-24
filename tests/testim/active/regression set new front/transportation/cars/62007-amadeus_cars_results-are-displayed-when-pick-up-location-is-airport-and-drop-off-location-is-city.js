/*
 * Test Name: 62007 Amadeus - Cars - Results are displayed when pick up location is airport and drop off location is city
 * Description: 
 * Status: Active
 * Labels: Cars,Regression,Amadeus,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-09T09:01:43Z
 * Updated: 2026-01-18T09:52:25Z
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
  await choose_rental_agency___enterprise();
  await Search_car_pick_up_and_drop_off_different('Charles de Gaulle (CDG),Paris, France', 'Le Havre,Le Havre,France,(LEH)');
  await Car___Results___Wait_for__Select__text();
  await waitForText(page, ".station-details > :nth-child(2) > :nth-child(1)", /LE HAVRE/);
  await Car___Results___Click__Select_();
  await click_on_select_again_if_you_still_see_the_current_screen();
  await click_on_select_again_if_you_still_see_the_current_screen_1();
  await Car___Results___Wait_for__Add_to_trip__text();
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

async function choose_rental_agency___enterprise() {
  await page.click("[id='tab-car'] p");
  await page.click(".is-one-quarter-desktop [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-5607-291", 'enter');
  await page.click("#el-id-5607-219 > span");
}

async function Search_car_pick_up_and_drop_off_different(pickUp, dropOff) {
  await page.click("#tab-car > div");
  await page.click("[id='pane-car'] .el-checkbox__inner");
  await page.type("#el-id-1330-266", pickUp);
  await page.waitFor(2000);
  await page.click("#el-id-5811-28-item-0 > div");
  await page.waitFor(1000);
  await page.type("#el-id-1330-282", dropOff);
  await page.waitFor(2000);
  await page.click("#el-id-1330-280-item-0 > div");
  await page.click("#el-id-1330-267");
  await page.dblclick("[id^='el-id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1330-270");
  await page.click("[id^='el-id'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Car___Results___Wait_for__Select__text() {
  await waitForText(page, ".btn--primary", 'Select');
}

async function Car___Results___Click__Select_() {
  await Car___Results___Wait_for__Select__text();
  await page.click(".btn--primary");
}

async function click_on_select_again_if_you_still_see_the_current_screen() {
  if (await getText(page, ".btn--primary") !== "'Select'") {
    return;
  }
  await Car___Results___Click__Select_();
}

async function click_on_select_again_if_you_still_see_the_current_screen_1() {
  if (await getText(page, ".btn--primary") !== "'Select'") {
    return;
  }
  await Car___Results___Click__Select_();
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

