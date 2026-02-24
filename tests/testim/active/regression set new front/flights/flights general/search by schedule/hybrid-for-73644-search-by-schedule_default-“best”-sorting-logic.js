/*
 * Test Name: HYBRID for 73644: Search by Schedule - Default “Best” Sorting Logic
 * Description: 
 * Status: Active
 * Labels: Flights,Regression,general,Search Flight,by schedule
 * Owner: Sónia Sousa
 * Created: 2026-02-14T02:33:08Z
 * Updated: 2026-02-14T03:54:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/home");
  await Login('corp.amadeus.reg.ss@amsalem.com');
  await Book_a_new_trip();
  await Add_traveler___Add_me__2026();
  await Search_flights_round_trip__by_schedule_('LON', 'JFK');
  await Flight___Results___Wait_for__Select__text();
  await Validate_default_sort_by_Best();
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

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function Check_prices_are_equal() {
  await page.evaluate(() => {
    function assertEqualSimple(valueInBest, valueInFirstOption) {
      // Fast fail for null/undefined
      if (valueInBest == null || valueInFirstOption == null) {
        throw new Error(`Missing value(s): valueInBest='${valueInBest}', valueInFirstOption='${valueInFirstOption}'`);
      }
    
      // Try numeric compare if both look like numbers (allow currency symbols and commas)
      const toNumber = (v) => {
        const s = String(v).trim().replace(/[^\d.,-]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
      };
    
      const aNum = toNumber(valueInBest);
      const bNum = toNumber(valueInFirstOption);
    
      if (aNum !== null && bNum !== null) {
        if (aNum === bNum) return true;
        throw new Error(`Values differ (numeric): ${aNum} !== ${bNum} | raw: '${valueInBest}' vs '${valueInFirstOption}'`);
      }
    
      // Fallback to plain string equality (case-sensitive)
      const a = String(valueInBest).trim();
      const b = String(valueInFirstOption).trim();
      if (a === b) return true;
    
      throw new Error(`Values differ (string): '${a}' !== '${b}'`);
    }
    
  });
}

async function Validate_default_sort_by_Best() {
  //TODO Please add an assertion here
await isVisible(page, ".flight-list-sort .is-active .el-radio-button__inner");
  //TODO Please add an assertion here
await getText(page, ".flight-list-sort .is-active .price");
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .price-wrapper > :nth-child(1) > :nth-child(2) .amount");
  await Check_prices_are_equal();
}

