/*
 * Test Name: 73097 Hyperlinks in RF and DYF and Push note
 * Description: 
 * Status: Active
 * Labels: Regression,Reference Fields,push notifications,2026 plan 2
 * Owner: pini harush
 * Created: 2026-01-29T06:50:39Z
 * Updated: 2026-01-29T07:30:00Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('new@guy33.com');
  await Book_a_new_trip();
  await Add_traveler___Add_me__2026();
  await Search_flights_one_way('ams', 'sin');
  await RF_validation();
  await Push_noth_validation();
  await Add_to_trip_first_flight();
  await push_note_cart_validation();
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

async function Book_a_new_trip() {
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

async function Add_traveler___Add_me__2026() {
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

async function RF_validation() {
  await waitForText(page, "#el-collapse-head-316 > span > div > span", 'General Reference Questions');
  await page.click("[id='el-collapse-content-316'] [target='_blank']");
  await waitForText(page, "[data-ved='0ahUKEwiMmsmMlrCSAxX32QIHHUwUMrIQ4dUDCBk']", 'Google Search');
  await page.click("body > :nth-child(16) .btn--primary");
}

async function Push_noth_validation() {
  await waitForText(page, "body > :nth-child(15) [role='heading']", 'Mandatory Notifications');
  await page.click(".mt5 > :nth-child(1)");
  await waitForText(page, "[data-ved='0ahUKEwiMmsmMlrCSAxX32QIHHUwUMrIQ4dUDCBk']", 'Google Search');
  await page.click("body > :nth-child(15) .btn");
  await page.click("body > :nth-child(15) .el-checkbox__inner");
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

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function push_note_cart_validation() {
  await waitForText(page, ".page-layout-right h6", 'Cart');
  await page.click(".btn-- .material-symbols-outlined");
  await waitForText(page, ".page-layout-right h5", 'All notifications');
  await page.click(".notification-container > :nth-child(3) .link-color");
  await page.click(".notification-message span > :nth-child(1)");
  await waitForText(page, "[data-ved='0ahUKEwiMmsmMlrCSAxX32QIHHUwUMrIQ4dUDCBk']", 'Google Search');
}

