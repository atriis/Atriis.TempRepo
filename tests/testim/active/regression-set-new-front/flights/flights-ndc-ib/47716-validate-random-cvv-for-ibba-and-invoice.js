/*
 * Test Name: 47716 Validate random CVV for IB/BA and invoice
 * Description: 1. INV by default- no cvv needed
2. change to CC with random cvv- no cvv needed
3. change for CC without random cvv- cvv needed

 * Status: Active
 * Labels: Flights,No Amadeus Hotel Book,Iberia,CVV,Random CVV,Regression,2026 plan 1
 * Owner: pini harush
 * Created: 2024-06-26T03:06:34Z
 * Updated: 2024-11-12T07:54:20Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("cvv@ib.com");
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way("MAD", "LON");
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".app-label--quote", 'Pending booking');
  await INV__validate_no_cvv();
  await random_cvv__validate_no_cvv();
  await CC__validate_cvv();
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function INV__validate_no_cvv() {
  await waitForText(page, ".fop-owner", 'Paid by  TMC');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function random_cvv__validate_no_cvv() {
  await page.click(".ticket-top-section .is-clickable");
  await page.click(".select-credit-card > :nth-child(3) > :nth-child(2) > :nth-child(2) .is-8");
  await page.click(".btn-save");
  await waitForText(page, ".fop-owner", 'Paid by  Corporate');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function CC__validate_cvv() {
  await page.click(".ticket-top-section .is-clickable");
  await page.click(".select-credit-card > :nth-child(3) > :nth-child(2) > :nth-child(3) .is-8");
  await page.click(".btn-save");
  await page.waitFor(1000);
  await waitForText(page, ".card-name", /CVV required/);
  await page.click("[type='number']");
  await page.type("[type='number']", '123');
}

