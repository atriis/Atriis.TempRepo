/*
 * Test Name: 40520 Flight advanced search
 * Description: 
 * Status: Active
 * Labels: Advanced search,search,Galileo,Filters,Flights,Regression,Search Flight,Keeps failing,2026 plan 1
 * Owner: pini harush
 * Created: 2023-12-24T08:09:30Z
 * Updated: 2025-09-14T07:47:35Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bsgalileoflight@galileoflight.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip__adv_('LON', 'LAX');
  await page.click(".carriers-filter .view-more-btn");
  //TODO Please add an assertion here
await isElementChecked(page, "[id='el-id-4596-992'] > :nth-child(4)");
  //TODO Please add an assertion here
await isElementChecked(page, "#el-id-4596-991 > label:nth-child(3)");
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .carrier-name", 'British Airways');
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

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
  await page.click(".trip-search-control");
}

async function Search_flights_round_trip__adv_(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  if (false) {
    await page.click(".ellipsis");
  }
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await old_date_picker();
  await page.click("[class^='pl'], [class*=' pl']");
  await page.click(".departure .flex > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-8424-285 > span");
  await page.click(".return .is-mobile > :nth-child(4) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-7777-313 > span");
  await page.click(".flight-more-search-inputs > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3516-328 > span");
  await page.click(".flight-more-search-inputs > :nth-child(2) [fill='currentColor']");
  await page.type("#el-id-3516-864", 'british');
  await page.click("#el-id-3516-464 > span");
  await page.click(".search-btn");
}

