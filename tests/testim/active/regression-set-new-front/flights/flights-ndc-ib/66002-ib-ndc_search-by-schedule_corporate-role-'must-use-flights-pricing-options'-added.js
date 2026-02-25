/*
 * Test Name: 66002 IB NDC - Search By Schedule - Corporate Role 'Must use flights pricing options' added
 * Description: The privilege 'Must Use Flights Pricing Options' must be assigned to the Booker role in administration.
 * Status: Active
 * Labels: Regression,results,Role,NDC,2026 plan 2
 * Owner: Sónia Sousa
 * Created: 2025-08-25T05:05:22Z
 * Updated: 2025-08-25T05:22:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ibndcuser@soniatest.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip__by_schedule_('MAD', 'BCN');
  await Outbound____Select_Flight__Visible___Pricing_Options__Not_Displayed();
  await Outbound___Verify_that_Pricing_Options_are_displayed();
  await Outbound___Select_a_flight();
  await Inbound____Select_Flight__Visible___Pricing_Options__Not_Displayed();
  await Inbound___Verify_that_Pricing_Options_are_displayed();
  await Inbound___Select_a_flight();
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

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Search_flights_round_trip__by_schedule_(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id*='id'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click(".search-btn");
}

async function Outbound____Select_Flight__Visible___Pricing_Options__Not_Displayed() {
  //TODO Please add an assertion here
await isVisible(page, ".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select flight');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Outbound___Verify_that_Pricing_Options_are_displayed() {
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, "#el-id-9612-305", 'Pricing Options');
}

async function Outbound___Select_a_flight() {
  await page.click("[aria-label='Pricing Options'] .flicking-camera > :nth-child(1) .btn--primary");
  await page.click(".add-btn");
}

async function Inbound____Select_Flight__Visible___Pricing_Options__Not_Displayed() {
  //TODO Please add an assertion here
await isVisible(page, ".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select flight');
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Inbound___Verify_that_Pricing_Options_are_displayed() {
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, "#el-id-9612-305", 'Pricing Options');
}

async function Inbound___Select_a_flight() {
  await page.click("[aria-label='Pricing Options'] .flicking-camera > :nth-child(1) .btn--primary");
  await page.click(".add-btn");
}

