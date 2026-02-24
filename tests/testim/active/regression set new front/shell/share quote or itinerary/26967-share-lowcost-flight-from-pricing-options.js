/*
 * Test Name: 26967 Share Low-Cost flight from pricing options
 * Description: On search results page able to click on Share button, add till 4 quotes and share it.
 * Status: Active
 * Labels: Regression,Flights,GDS,No Amadeus Hotel Book,Fit for Prod,Search Flight,FailedFusion,2026 plan 1
 * Owner: pini harush
 * Created: 2023-03-30T11:12:52Z
 * Updated: 2025-12-24T06:27:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('low@cost.mail');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_one_way('LON', 'DUB');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Share_flight_Results_page();
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

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Share_flight_Results_page() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list-sort .material-symbols-outlined");
  await Flight___Click__Pricing_Options_();
  await page.click(".pricing-options-section > :nth-child(4) .desktop-btn");
  await page.click(".add-btn");
  await waitForText(page, ".has-text-primary", /Added/);
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".flight-list-sort .btn", {state: "visible"});
  await scrollToElement(page, ".flight-list > :nth-child(2) .is-bold");
  await page.waitFor(1000);
  await page.click(".flight-list > :nth-child(2) .is-bold");
  await page.click(".pricing-options-section > :nth-child(4) .desktop-btn");
  await page.waitFor(1000);
  await page.click(".add-btn");
  await page.click("#el-drawer__title > button > i");
  // Converting a 'wait-for-code-step' step has to be done manually at this time
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
  await page.click(".is-focus .el-checkbox__inner");
  await waitForText(page, "body > :nth-child(12) [class^='mb'], [class*=' mb']", 'Include in price offer');
  await page.click("body > :nth-child(12) .btn--primary");
  await Success_toast_alert();
}

