/*
 * Test Name: 49287 Flight - Travel Policy - Can select the flight with travel policy with specific time
 * Description: 
 * Status: Active
 * Labels: Travel policy,Regression,Flights,time,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-02-07T07:53:09Z
 * Updated: 2025-06-17T11:33:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('jeffsan@travelpolicy.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way___early_time('LON', 'MAD');
  //TODO Please add an assertion here
await isVisible(page, ".flight-list > :nth-child(1) .out-of-policy-badge");
  await page.hover(".flight-list > :nth-child(1) .info-icon");
  await waitForText(page, "#el-id-2828-885 > ul > li", 'Hour of departure Is Before 11:00 Inbound Flight');
  await Add_to_trip_flight();
  await Trip_Cancelation();
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

async function Search_flights_one_way___early_time(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-8223-301");
  await page.click("[id*='id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[class^='mt'], [class*=' mt']");
  await page.click(".flight-form > :nth-child(2) .is-flex-direction-column > :nth-child(2) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2922-307");
  await waitForText(page, ".flight-form > :nth-child(2) .is-flex-direction-column > :nth-child(2) > :nth-child(3) span", 'Early (04:00-08:00)');
  await page.click(".search-btn");
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

async function Add_to_trip_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

