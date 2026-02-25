/*
 * Test Name: 47297 can send travel request when using parallel search
 * Description: 
 * Status: Active
 * Labels: Regression,Request Assistance,Parallel,Flights,Hotel,No Amadeus Hotel Book,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-06-19T09:20:53Z
 * Updated: 2026-02-15T08:31:04Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Send_flight_travel_request_with_hotel_checkbox_checked();
  await Request_assistance_button();
  await validate_values_in_travel_request_form();
  await click_on_send_request();
  await Pop_up_with_reference_and_dynamic_fields_opens();
  await fill_financial_reference_and_dynamic();
  await waitForText(page, ".success-message__title", 'Sent to agent');
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

async function Send_flight_travel_request_with_hotel_checkbox_checked() {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", 'LON');
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", 'MAD');
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click("[class^='mr'], [class*=' mr'] .el-checkbox__inner");
  await page.waitFor(1000);
  //TODO Please add an assertion here
await getText(page, "[placeholder='Depart Date']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Return Date']");
}

async function Request_assistance_button() {
  await page.click(".page-view .icon-container");
}

async function validate_values_in_travel_request_form() {
  await waitForText(page, ".travelers-container [class^='mb'], [class*=' mb']", 'Who are the travellers?');
  await waitForText(page, ".request-assistance-main > :nth-child(2) .product-name", 'Flight');
  await waitForText(page, "#el-id-8408-2007", 'London, United Kingdom - All airports (LON)');
  await waitForText(page, "#el-id-8408-2008", 'Madrid, Spain (MAD)');
  await waitForText(page, "[placeholder='Depart Date']", fromDate);
  await waitForText(page, "[placeholder='Return Date']", toDate);
  await scrollTo(page, 0, 500);
  await waitForText(page, ".request-assistance-main > :nth-child(3) .product-name", 'Hotel');
  await waitForText(page, "#el-id-8408-2037", 'Madrid,Spain,(MAD)');
  await waitForText(page, "[placeholder='Check in']", fromDate);
  await waitForText(page, "[placeholder='Check out']", toDate);
}

async function click_on_send_request() {
  await page.click(".btn--primary");
}

async function Pop_up_with_reference_and_dynamic_fields_opens() {
  await waitForText(page, "body > :nth-child(13) .el-dialog__title", 'Trip Reference Form');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function fill_financial_reference_and_dynamic() {
  await page.click("[id='el-collapse-content-1013'] [fill='currentColor']");
  await page.click("#el-id-9837-1016 > span");
  await page.click("[id='el-collapse-content-1019'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-9837-1030 > span");
  await page.click("body > :nth-child(21) .btn--primary");
  await Success_toast_alert();
}

