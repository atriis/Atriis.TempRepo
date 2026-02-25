/*
 * Test Name: 35108 Flight - When searching for Business class the addional pricing options must display the Business brands BSFLXPLUS
 * Description: 
 * Status: Active
 * Labels: CR7,No Amadeus Hotel Book,Regression,Keeps failing,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-08-28T06:53:03Z
 * Updated: 2025-11-14T02:38:02Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("sabre@testim.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip_business('LHR', 'KUL');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Search_flight_in_results_page('EK');
  await Flight___Click__Pricing_Options_();
  await When_searching_for_Business_class_the_addional_pricing_options_must_display_the_Business_brands_BSFLXPLUS();
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

async function Search_flights_round_trip_business(from, to) {
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
  await page.click(".class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4469-1592");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Search_flight_in_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Validate_if_BSFLXPLUS_option_appear(first, second) {
  await page.evaluate((first, second) => {
    const firstPO = first;
    const secondPO = second;
    
    if (firstPO === "Business Flexplus") {
        console.log("First price option is " + firstPO);
    } else if (secondPO === "Business Flexplus") {
        console.log("Second price option is " + secondPO);
    } else {
        return "Error: Neither string is 'Business Flexplus'.";
    }
  }, first, second);
}

async function When_searching_for_Business_class_the_addional_pricing_options_must_display_the_Business_brands_BSFLXPLUS() {
  if (await getText(page, ".pricing-options-section > :nth-child(1) .brand-name") === "/plus/") {
    //TODO Please add an assertion here
await getText(page, ".pricing-options-section > :nth-child(1) .brand-name");
  }
  if (await getText(page, ".pricing-options-section > :nth-child(2) .brand-name") === "/plus/") {
    //TODO Please add an assertion here
await getText(page, ".pricing-options-section > :nth-child(2) .brand-name");
  }
  await Validate_if_BSFLXPLUS_option_appear(first, second);
}

