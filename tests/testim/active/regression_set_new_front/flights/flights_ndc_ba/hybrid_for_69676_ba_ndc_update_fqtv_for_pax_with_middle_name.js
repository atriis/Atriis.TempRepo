/*
 * Test Name: Hybrid for 69676: BA NDC - Update FQTV for Pax with middle name
 * Description: 
 * Status: Active
 * Labels: BA NDC Regression,Amsalem,FQTV,hold flight,Search Flight,2026 plan 2
 * Owner: Noam Miller
 * Created: 2025-11-02T08:44:17Z
 * Updated: 2025-11-02T11:25:21Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('baFqtv@update.ams');
  await Book_a_new_trip();
  await Add_traveler___By_name('Elisabeth');
  await Search_flights_round_trip('LHR', 'LAX');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Add_to_trip_first_flight();
  await Accept__Terms___Conditions_();
  await Hold_flight();
  await Add_FQTV();
  await page.waitFor(60000);
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

async function Book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function Add_traveler___By_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
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

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Price_Change() {
  if (await getText(page, ".muliBold") !== "'Price change'") {
    return;
  }
  await page.click(".app-footer .is-flex-wrap-wrap .btn--primary");
}

async function On() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Hold_flight() {
  await page.click(".quote-card .btn--default");
  await Price_Change();
  await On();
}

async function Add_FQTV() {
  await scrollToElement(page, ".flight-frequent-flyer .is-clickable");
  if (await getText(page, ".flight-frequent-flyer .card-title") === "'Frequent Flyer'") {
    await page.click(".flight-frequent-flyer .is-clickable");
  }
  await waitForText(page, ".el-radio-group > :nth-child(1) .el-radio__label", 'Existing');
  await page.click("#el-id-4335-876");
  await page.type("#el-id-4335-876", '1771177117');
  await page.click("[id='el-collapse-content-313'] [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-4335-877", 'Alaska');
  await page.click("#el-id-4335-433 > span");
  await page.click("[id='pane-overview'] .btn--primary");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

