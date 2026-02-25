/*
 * Test Name: 35085 ALLEGRISE Seat map ALLEGRISE 
 * Description: Flaky test. Flights change all the time. Removed from regression and informed Yael.
 * Status: Draft
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-08-28T11:00:05Z
 * Updated: 2024-10-15T05:58:24Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@FLX.nl');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('MUC', 'BKK');
  await page.click("body > :nth-child(15) .btn--primary");
  await page.click("[placeholder='Search flight']");
  await page.type("[placeholder='Search flight']", 'LH');
  await waitForText(page, ".flight-list > :nth-child(1) .flight-info-bottom-bar span", /NEW SEAT TYPES/);
  await page.click(".flight-list > :nth-child(1) .add-to-trip");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".text--bold", 'Pending booking');
  await page.click(".flight-seating .is-clickable");
  await waitForText(page, "[id='pane-0'] .btn", 'Add Seats');
  await page.click("[id='pane-0'] .btn");
  await waitForText(page, ".flight-passengers .btn", 'Reset');
  await page.click("#tab-2");
  await page.click("[aria-describedby='el-tooltip-3885'] span");
  //TODO Please add an assertion here
await isVisible(page, "[x-placement='bottom'] .is-active [draggable='true']");
  //TODO Please add an assertion here
await isVisible(page, "#el-tooltip-7167");
  await page.click("[x-placement='bottom'] .is-flex-direction-row > div:nth-of-type(1) .btn");
  await waitForText(page, ".brand-info > div:nth-of-type(1) div", 'The following ancillaries are included in this brand.');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) .is-active [draggable='true']");
  await page.click("body > :nth-child(14) .btn--primary");
  await page.click(".page-layout-main .btn--primary");
  await waitForText(page, ".text--bold", 'Pending booking');
  await scrollTo(page, 0, 423.4666748046875);
  await scrollToElement(page, ".filled");
  await page.waitForSelector(".filled", {state: "visible"});
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

async function Search_flights_round_trip(from, to) {
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
  await page.click(".search-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

