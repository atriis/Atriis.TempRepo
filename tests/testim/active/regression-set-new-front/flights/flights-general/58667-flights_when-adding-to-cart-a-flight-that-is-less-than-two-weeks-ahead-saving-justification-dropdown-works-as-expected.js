/*
 * Test Name: 58667 Flights - When adding to cart a flight that is less than two weeks ahead, saving justification dropdown works as expected
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,Travel policy,OOP,dropdown,general,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-02-26T07:00:07Z
 * Updated: 2025-09-16T02:24:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('lexasofia@travelpolicytest.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Flight_search_same_day('LON', 'MAD');
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await When_adding_to_cart_a_flight_that_is_less_than_two_weeks_ahead__saving_justification_dropdown_works_as_expected();
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

async function Flight_search_same_day(from, to) {
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

async function When_adding_to_cart_a_flight_that_is_less_than_two_weeks_ahead__saving_justification_dropdown_works_as_expected() {
  await waitForText(page, ".out-of-policy-label", 'Destination is not brazil');
  await page.click(".oop-justification [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(500);
  //TODO Please add an assertion here
await getText(page, "#el-id-9640-494 > span");
  await page.click("#el-id-9640-494 > span");
  await page.click(".ticket-bottom .btn");
  await waitForText(page, ".out-of-policy-label", 'Destination is not brazil');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await waitForText(page, ".oop-justification span", dropdown);
}

