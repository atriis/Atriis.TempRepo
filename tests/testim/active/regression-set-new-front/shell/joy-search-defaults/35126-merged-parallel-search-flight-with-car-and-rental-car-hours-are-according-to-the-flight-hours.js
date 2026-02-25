/*
 * Test Name: 35126 MERGED Parallel search flight with Car and rental car hours are according to the flight hours
 * Description: 
 * Status: Active
 * Labels: Cars,Parallel,Flights,Regression,No Amadeus Hotel Book,Search Flight,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-09-05T08:56:58Z
 * Updated: 2025-09-14T06:32:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunasantos@nlgov.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip_without_add_hotel_checkbox_checked('MUC', 'BUD');
  await click_on_proceed_after_search();
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".gray", 'Car');
  await waitForText(page, ".app-filter__content > :nth-child(3) h4", 'Car Class');
  await waitForText(page, ".car-list > :nth-child(1) .desktop-btn", 'Add to trip');
  await add_car_from_results_page_to_cart();
  await waitForText(page, ".flight-quote-card .has-text-weight-bold", 'Pending booking');
  await waitForText(page, ".flight-quote-card .has-text-weight-semibold", 'Flight to Budapest');
  await scrollTo(page, 0, 1100);
  await waitForText(page, ".car-quote-card .has-text-weight-semibold", /Hungary/);
  await validate_car_hours_are_according_to_the_flight_hours();
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
  await page.click(".trip-search-control");
}

async function Search_flights_round_trip_without_add_hotel_checkbox_checked(from, to) {
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
  await old_date_picker();
  await page.waitFor(3000);
  await page.click(".is-align-flex-start .el-checkbox__inner");
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
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

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function validate_hours(hour1, hour2, string3, string4) {
  await page.evaluate((hour1, hour2, string3, string4) => {
    // Convert the hour strings (HH:MM format) into Date objects for easy manipulation
    function parseTime(hourString) {
        const [hours, minutes] = hourString.split(':').map(num => parseInt(num, 10));
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);  // Set hours and minutes, and reset seconds and milliseconds
        return date;
    }
    
    // Add minutes to a Date object
    function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);  // 60000 ms = 1 minute
    }
    
    // Subtract minutes from a Date object
    function subtractMinutes(date, minutes) {
        return new Date(date.getTime() - minutes * 60000);  // 60000 ms = 1 minute
    }
    
    // Parse hour1 and hour2
    const time1 = parseTime(hour1);
    const time2 = parseTime(hour2);
    
    // Calculate the new times (plus 30 and minus 30)
    const time1Plus30 = addMinutes(time1, 30);
    const time2Minus30 = subtractMinutes(time2, 30);
    
    // Convert times back to HH:MM format strings
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    const hour1Plus30Str = formatTime(time1Plus30);
    const hour2Minus30Str = formatTime(time2Minus30);
    
    console.log("hour1 plus 30 minutes is:", hour1Plus30Str);
    console.log("hour2 minus 30 minutes is:", hour2Minus30Str);
    
    // Validation: Check if hour1 + 30 minutes is included in string3
    const isHour1Plus30InString3 = string3.includes(hour1Plus30Str);
    if (!isHour1Plus30InString3) {
        throw new Error(`Validation failed: ${hour1Plus30Str} is not found in the pickup car hour.`);
    }
    
    // Validation: Check if hour2 - 30 minutes is included in string4
    const isHour2Minus30InString4 = string4.includes(hour2Minus30Str);
    if (!isHour2Minus30InString4) {
        throw new Error(`Validation failed: ${hour2Minus30Str} is not found in the dropoff car hour.`);
    }
    
    // If both validations pass
    return true;
  }, hour1, hour2, string3, string4);
}

async function validate_car_hours_are_according_to_the_flight_hours() {
  //TODO Please add an assertion here
await getText(page, ".not-last-segment .is-align-items-end .flight-time");
  //TODO Please add an assertion here
await getText(page, ".has-extra-info > :nth-child(1) > :nth-child(2) .flight-duration > :nth-child(1) .flight-time");
  //TODO Please add an assertion here
await getText(page, ".pickup-details p");
  //TODO Please add an assertion here
await getText(page, ".dropoff-details p");
  await validate_hours(hour1, hour2, carhour1, carhour2);
}

