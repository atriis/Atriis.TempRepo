/*
 * Test Name: 62013 Evolvi - Inbound codes are correct in cart
 * Description: 
 * Status: Active
 * Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-09T12:42:19Z
 * Updated: 2025-12-09T05:06:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('thiagosantos@evolvi.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__rountrip_search('LIC', 'London Euston (EUS)');
  await close_mandatory_notification();
  await Add_Evolvi_to_cart();
  await Validating_codes_are_correct_in_cart();
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

async function UK_Rail__Evolvi__rountrip_search(from, to) {
  await page.click(".el-tabs__header .el-input");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.waitFor(1000);
  await page.type("[aria-activedescendant^='el-autocomplete']", from);
  await sendSpecialCharacter(page, "#el-id-4295-1096", 'Tab');
  await page.click("[id='pane-rails'] [placeholder='Depart Date']");
  await page.dblclick(".el-zoom-in-top-enter-from [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9009-999'] tbody > :nth-child(3) > :nth-child(7)");
  await page.type("[aria-activedescendant='el-autocomplete-9190-item--1']", to);
  await sendSpecialCharacter(page, "#el-id-4295-1101", 'Tab');
  await page.click("[placeholder='Pick-up date']");
  await page.click("[id='el-id-5512-76'] tbody > :nth-child(4) > :nth-child(3)");
  await page.waitForSelector("[id^='el-id']", {state: "visible"});
  if (await isVisible(page, "form > :nth-child(4) > :nth-child(3) .el-checkbox__inner")) {
    await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  }
  await page.click(".search-btn");
}

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function UK_Rail__Evolvi__add_to_cart() {
  await waitForText(page, ".selected-prices-container .btn", 'Add to trip');
  await page.click(".uk-rail-results .btn");
  await Pending_booking___wait_for_element_text();
}

async function Add_Evolvi_to_cart() {
  await waitForText(page, ".cap", 'Results');
  await page.click("[aria-describedby='el-id-4790-203'] .amount");
  await UK_Rail__Evolvi__add_to_cart();
}

async function Validating_codes_are_correct_in_cart() {
  await waitForText(page, ".ticket-details [class^='p'], [class*=' p'] > :nth-child(1) .segment-route > :nth-child(1)", 'Lichfield City (LIC)');
  await waitForText(page, ".ticket-details [class^='p'], [class*=' p'] > :nth-child(1) .segment-route > :nth-child(3)", 'London Euston (EUS)');
  await waitForText(page, ".ticket-details [class^='p'], [class*=' p'] > :nth-child(2) .segment-route > :nth-child(1)", 'London Euston (EUS)');
  await waitForText(page, ".ticket-details [class^='p'], [class*=' p'] > :nth-child(2) .segment-route > :nth-child(3)", 'Lichfield City (LIC)');
}

