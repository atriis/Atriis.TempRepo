/*
 * Test Name: 54024 Galileo - Flight - Display Rules - Hiding carrier results works
 * Description: 
 * Status: Active
 * Labels: Galileo,Regression,Flights,carrier,display rules,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-02-12T07:14:13Z
 * Updated: 2025-06-17T11:44:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('beatrizpamplonacorp@galileo.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way___nonstop('DUB', 'MAD');
  await Search_flight_results_page('FR');
  await page.hover(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, "#el-id-4767-884", 'Selection is disabled due to your company settings');
  await Search_flight_results_page('EI');
  await page.hover(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, "#el-id-4767-884", 'Selection is disabled due to your company settings');
  await Search_flight_results_page('IB');
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
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

async function Search_flights_one_way___nonstop(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-7504-298");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[class^='pl'], [class*=' pl']");
  await page.click(".flight-more-search-inputs > :nth-child(1) .material-symbols-outlined");
  await page.click("#el-id-4767-313 > span");
  await page.click(".search-btn");
}

async function Search_flight_results_page(flight) {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", /(Add to trip|Select)/);
  await page.type("#el-id-3356-666", flight);
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

