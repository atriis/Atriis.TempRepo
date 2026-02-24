/*
 * Test Name: 62140 Travelodge - Correct number of nights is displayed in room level page
 * Description: 
 * Status: Active
 * Labels: Travelodge,Hotel,Regression,room level,Giata,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-16T03:09:23Z
 * Updated: 2025-09-14T11:02:09Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('pluto@travelodgecorp.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_3_nights('London Borough of Camden');
  await Correct_number_of_nights_is_displayed_in_room_level_page();
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

async function Search_hotel_3_nights(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.waitFor(1000);
  await page.click("[placeholder='Check in']");
  await page.click(".arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".start-date .el-date-table-cell__text");
  await page.click("[placeholder='Check out']");
  await page.click(".is-left tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click("[placeholder='Check in']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function Hotel___Wait_for__View_rates__text_in_results_page() {
  await waitForText(page, ".hotel-list > :nth-child(1) .extra-info a", 'View rates');
}

async function Hotel___Click__View_rates_() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function Correct_number_of_nights_is_displayed_in_room_level_page() {
  await Hotel___Click__View_rates_();
  await waitForText(page, ".room-list > :nth-child(2) .price-suffix .muliSemiBold", '1 Room · 3 Nights');
}

