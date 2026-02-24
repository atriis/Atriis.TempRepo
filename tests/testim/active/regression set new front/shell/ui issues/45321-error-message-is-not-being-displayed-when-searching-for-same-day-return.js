/*
 * Test Name: 45321 Error message is not being displayed when searching for same day return
 * Description: 
 * Status: Active
 * Labels: Regression,UI,Flights,general,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-04-26T08:59:12Z
 * Updated: 2025-08-19T01:30:03Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimendes@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Flight_search_same_day_roundtrip('AMS', 'GVA');
  // Converting a 'negative-element-validation' step has to be done manually at this time
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

async function test() {
  await page.evaluate(() => {
    // Select all matching <td> elements instead of just the <span>
    const elements = document.querySelectorAll('.el-picker-panel__content.el-date-range-picker__content.is-left table tbody td.available.today');
    
    if (elements.length > 1) {
        // Click the second td directly
        elements[1].click();
    } else {
        throw new Error("Second element not found.");
    }
    
  });
}

async function Select_flight_today() {
  await test();
}

async function Select_flight_today_1() {
  await page.evaluate(() => {
    // Select all matching <td> elements instead of just the <span>
    const elements = document.querySelectorAll('.el-picker-panel__content.el-date-range-picker__content.is-left table tbody td.available.today');
    
    if (elements.length > 1) {
        // Click the second td directly
        elements[1].click();
    } else {
        throw new Error("Second element not found.");
    }
    
  });
}

async function Select_flight_today_2() {
  await Select_flight_today_1();
}

async function Flight_search_same_day_roundtrip(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.waitFor(500);
  await Select_flight_today();
  await page.waitFor(500);
  await Select_flight_today_2();
  await waitForText(page, "[placeholder='Return Date']", /,/);
  await page.click(".search-btn");
}

