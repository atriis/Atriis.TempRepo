/*
 * Test Name: 56091 Transferz - Pickup date and time are displayed in cart page
 * Description: 
 * Status: Active
 * Labels: Transferz Regression,Cart,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-11-07T11:31:06Z
 * Updated: 2025-12-17T08:50:26Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('betoribeiro@transferz.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Groundscope_search___changing_pick_up_time('lhr', 'stn');
  await add_transferz_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Validate_that_pickup_date_and_time_are_displayed_correctly();
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

async function Groundscope_search___changing_pick_up_time(Pickup, Dropoff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", Pickup);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", Dropoff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("#el-id-9034-552");
  await page.click("[name='hours'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-964-561 > span");
  await page.waitFor(1000);
  await page.type("#el-id-9146-795", 'all vehicle types');
  await page.click("[id*='id'] span");
  await page.waitFor(1000);
  await page.click(".details-container > :nth-child(2) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6660-916 > span");
  await page.click(".ground-transport-search-content");
  await page.click(".ground-transport-search-content");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper ']");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.click(".search-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_transferz_from_results_page_to_cart() {
  await waitForText(page, ".desktop-btn", 'Add to trip');
  await page.click(".desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function test(value) {
  await page.evaluate((value) => {
    function validateDatetime(value) {
      console.log("Raw input:", JSON.stringify(value));
      value = value.trim().replace(/\u00B7/g, '·').replace(/\s+/g, ' ');
      console.log("Normalized input:", value);
    
      // Looser regex: accept full words for months
      const regex = /^\d{2} [A-Za-z]+ \d{4} · \d{2}:\d{2}$/;
      if (!regex.test(value)) {
        throw new Error('Invalid format. The correct format is "DD MMM YYYY · HH:MM"');
      }
    
      const [datePart, timePart] = value.split(" · ");
      const [day, monthName, year] = datePart.split(" ");
      const [hours, minutes] = timePart.split(":");
    
      const validMonths = {
        Jan: 0, January: 0,
        Feb: 1, February: 1,
        Mar: 2, March: 2,
        Apr: 3, April: 3,
        May: 4,
        Jun: 5, June: 5,
        Jul: 6, July: 6,
        Aug: 7, August: 7,
        Sep: 8, Sept: 8, September: 8,
        Oct: 9, October: 9,
        Nov: 10, November: 10,
        Dec: 11, December: 11
      };
    
      const dayInt = parseInt(day, 10);
      const yearInt = parseInt(year, 10);
      const hoursInt = parseInt(hours, 10);
      const minutesInt = parseInt(minutes, 10);
      const monthIndex = validMonths[monthName];
    
      if (monthIndex === undefined) throw new Error(`Invalid month: '${monthName}'`);
      if (dayInt < 1 || dayInt > 31) throw new Error(`Invalid day: '${day}'`);
      if (yearInt < 1000 || yearInt > 9999) throw new Error(`Invalid year: '${year}'`);
      if (hoursInt < 0 || hoursInt > 23 || minutesInt < 0 || minutesInt > 59) {
        throw new Error(`Invalid time: '${hours}:${minutes}'`);
      }
    
      const inputDate = new Date(yearInt, monthIndex, dayInt, hoursInt, minutesInt);
      const now = new Date();
      if (inputDate <= now) throw new Error(`Date '${value}' must be in the future.`);
    
      console.log("✅ Valid date in the future.");
      return true;
    }
    
    // Test with full month name
    validateDatetime(value);
    
  }, value);
}

async function Validate_that_pickup_date_and_time_are_displayed_correctly() {
  //TODO Please add an assertion here
await getText(page, ".pickupdropoff-detailed p");
  await test(dateAndTime);
}

