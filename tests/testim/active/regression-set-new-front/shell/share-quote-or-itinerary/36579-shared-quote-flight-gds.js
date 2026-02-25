/*
 * Test Name: 36579 Shared quote flight GDS
 * Description: 
 * Status: Active
 * Labels: CR7,Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: Unassigned
 * Created: 2023-08-17T01:51:04Z
 * Updated: 2025-09-08T09:18:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("ruimendes@amadeus.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip("london", "istanbul");
  await Click_share_quote_button();
  await Select_flight_quotes();
  await click_mail_preview();
  await Mail_validation();
  await page.click("body > :nth-child(23) .is-hidden-mobile");
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

async function scrollOnElement(page, selector, x, y) {
  await page.evaluate(([selector, x, y]) => {
    const element = document.querySelector(selector);
    element.scroll(x, y);
  }, [selector, x, y]);
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

async function Click_share_quote_button() {
  await page.click(".actions .material-symbols-outlined");
}

async function Select_flight_quotes() {
  await page.click(".flight-list > :nth-child(1) .share-btn");
  await scrollToElement(page, ".flight-list > :nth-child(2) .share-btn");
  await page.click(".flight-list > :nth-child(2) .share-btn");
  await scrollToElement(page, ".flight-list > :nth-child(3) .share-btn");
  await page.click(".flight-list > :nth-child(3) .share-btn");
}

async function click_mail_preview() {
  await page.click(".is-hidden-mobile .material-symbols-outlined");
  await page.waitForSelector(".trip-traveler-tag", {state: "visible"});
}

async function Mail_validation() {
  await scrollOnElement(page, ".share-quotes-form", 0, 274.1666564941406);
  await waitForText(page, ".em_main_table > :nth-child(1) > :nth-child(3) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(2) > tr:nth-of-type(7) [ng-switch-when='true']", 'Flight Offer # 1 Pending booking');
  await scrollTo(page, 0, 750);
  await waitForText(page, ".em_main_table > :nth-child(1) > :nth-child(3) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(2) > tr:nth-of-type(10) [ng-switch-when='true']", 'Flight Offer # 2 Pending booking');
  await scrollTo(page, 0, 1125);
  await waitForText(page, ".em_main_table > :nth-child(1) > :nth-child(3) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(2) > tr:nth-of-type(13) [ng-switch-when='true']", 'Flight Offer # 3 Pending booking');
}

