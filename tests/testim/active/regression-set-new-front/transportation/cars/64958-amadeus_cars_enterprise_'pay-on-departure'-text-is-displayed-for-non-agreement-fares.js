/*
 * Test Name: 64958 Amadeus - Cars - Enterprise - 'Pay on Departure' text is displayed for non agreement fares
 * Description: 
 * Status: Active
 * Labels: search,Regression,Cars,Amadeus,non agreement,specific,rental agency,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-07-30T02:50:05Z
 * Updated: 2025-07-30T03:38:40Z
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
  await Select_Enterprise_rental_agency();
  await search_car_by_place('MXP');
  await Car___Results___Wait_for__Add_to_trip__text();
  await Non_agreement_fare();
  await Extract_payment_cart_page();
  await add_car_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Extract_payment_results_page();
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

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Select_Enterprise_rental_agency() {
  await page.type("#el-id-1103-608", 'enterprise');
  await page.click("[id*='id']");
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function old() {
  if (true) {
    return;
  }
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  if (false) {
    await page.click("[placeholder='Pick-up Date']");
  }
  if (false) {
    await page.click("[aria-label='Next Month']");
  }
  if (false) {
    await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(2) span");
  }
  await page.click("#el-id-9250-87");
  await page.click("[id='el-id-3812-54'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-993-38 > span");
  await page.waitFor(1000);
  await page.click("[id='el-id-9786-26'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  if (false) {
    await page.click("#el-id-8716-55 > span");
  }
  await page.click("#el-id-7049-91 > span");
  await page.click("[id='el-id-2044-100'] .btn-apply");
  if (false) {
    await page.click("[placeholder='Drop-off Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(6) > td:nth-of-type(3) span");
  }
  await page.click("#el-id-9250-122");
  await page.waitFor(1000);
  await page.click("[id='el-id-9250-123'] [class^='mr'], [class*=' mr'] .el-select__wrapper");
  await page.click("#el-id-9198-139 > span");
  await page.click("[id='el-id-9198-123'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-8989-90 > span");
  await page.click("[id='el-id-9151-135'] .btn-apply");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
  await page.click(".search-btn");
}

async function search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click(".search-btn");
  await old2();
  await old();
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function Non_agreement_fare() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Extract_payment_cart_page() {
  await waitForText(page, ".car-list > :nth-child(1) .payment-method p", 'Pay On Departure');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Extract_payment_results_page() {
  await waitForText(page, ".payment-method p", 'Pay On Departure');
}

