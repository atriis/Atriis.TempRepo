/*
 * Test Name: 29725 Financial reference codes on travel requests pop up are taken from the user group of the primary traveler - 2 users, second is the primary
 * Description: financial reference on travel request pop up determined by primary traveler. in this test the primary is a corporate user
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-02-01T02:54:59Z
 * Updated: 2023-12-20T01:05:33Z
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
  await add_traveler_by_name('pini cohen');
  await add_second_traveler_by_name___primary('gadi cohen');
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

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function refresh_tab() {
  await page.reload();
}

async function refresh_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await refresh_tab();
}

async function add_second_traveler_by_name___primary(name) {
  await page.waitFor(500);
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("h2");
  if (false) {
    await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  }
  if (false) {
    // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  }
  await page.waitFor(2000);
  await refresh_if_there_is_no_star();
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
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span", 'uploadname3 (uploadcode3)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span", 'uploadname4 (uploadcode4)');
}

async function validate_mandatory() {
  await page.click("[id='el-collapse-content-8069'] .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(3)");
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

