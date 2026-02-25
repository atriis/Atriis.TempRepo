/*
 * Test Name: 57473 Amadeus - Hotel - Supplier corresponds to the one that is configured in admin
 * Description: 
 * Status: Active
 * Labels: Amadeus,Hotel,supplier,GDS,Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-31T11:49:03Z
 * Updated: 2025-11-20T08:14:52Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('jamescraig@amadeushotelyourtravelimted.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('Hilton Cambridge city centre');
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await Search_hotel_results_page('Hilton Cambridge ');
  await Validating_correct_supplier_in_hotel_and_room_level();
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

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function Hotel___Wait_for__View_rates__text_in_results_page() {
  await waitForText(page, ".hotel-list > :nth-child(1) .extra-info a", 'View rates');
}

async function Search_hotel_results_page(name) {
  await waitForText(page, ".app-price-slider .filter-name", 'Price');
  await page.type("#el-id-3990-1048", name);
  await page.waitFor(1000);
}

async function Hotel___Click__View_rates_() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function Validating_correct_supplier_in_hotel_and_room_level() {
  await page.waitFor(1000);
  await Hotel___Wait_for__View_rates__text_in_results_page();
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await Hotel___Click__View_rates_();
  await waitForText(page, ".room-list > :nth-child(3) .is-hidden-mobile", 'Price details');
  //TODO Please add an assertion here
await isVisible(page, ".room-list > :nth-child(3) [class^='mr'], [class*=' mr']");
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

