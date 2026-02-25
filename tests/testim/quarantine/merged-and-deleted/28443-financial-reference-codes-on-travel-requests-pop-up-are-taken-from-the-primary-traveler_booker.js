/*
 * Test Name: 28443 Financial reference codes on travel requests pop up are taken from the primary traveler - booker
 * Description: financial reference on travel request pop up determined by primary traveler. in this test the primary is the booker
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-02-01T02:54:59Z
 * Updated: 2023-12-12T01:28:42Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Request_assistance__hotel('London');
  await click_on_send_request();
  await validate_field();
  await validate_content();
  await validate_mandatory();
  await validate_can_proceed();
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Request_assistance__hotel(destination) {
  await page.click("#tab-hotel > div");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", destination);
  await page.waitFor(1000);
  await sendSpecialCharacter(page, "#el-id-7300-759", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(3)");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(4)");
  await page.click(".btn--default");
}

async function click_on_send_request() {
  await page.click(".btn--primary");
}

async function validate_field() {
  await waitForText(page, ".financial-section [class^='ml'], [class*=' ml']", '*');
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, ".financial-section [type='text']", '');
  await page.click(".financial-section .el-select__caret");
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span", 'uploadname10 (uploadcode10)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span", 'uploadname9 (uploadcode9)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span", 'uploadname8 (uploadcode8)');
}

async function validate_mandatory() {
  await page.click("[name='Soort reis/Type of trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("body > :nth-child(10) .btn--primary");
  await page.waitFor(500);
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
}

async function validate_can_proceed() {
  await page.click(".financial-section [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

