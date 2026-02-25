/*
 * Test Name: 29728 Financial reference codes on travel requests pop up are taken from the primary traveler - guest
 * Description: financial reference on travel request pop up determined by primary traveler. in this test the primary is a guest
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-02-01T02:54:59Z
 * Updated: 2023-12-20T01:33:26Z
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
  await add_guest_Israel_Israeli();
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

async function add_guest_Israel_Israeli() {
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.waitFor(500);
  await page.click(".copy-settings-container [type='text']");
  await page.type(".copy-settings-container [type='text']", 'post berlijn');
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(4) span");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.type("[placeholder='First Name']", 'Israel');
  await page.type("[placeholder='Middle Name']", 'Yakov');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.click("[aria-label='Next Year']");
  await page.click(".el-year-table tbody > :nth-child(3) > td:nth-of-type(2) .cell");
  await page.click(".el-month-table tbody > :nth-child(1) > td:nth-of-type(1) .cell");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(1) span");
  await page.click("[placeholder='Nationality']");
  await page.type("[placeholder='Nationality']", 'isr');
  await page.click(".natinolity-add-guest .el-scrollbar__view > :nth-child(108)");
  await page.type("[placeholder='Enter email address']", 'israel@israeli.com');
  await page.type("[placeholder='Enter phone number']", '04-6548745');
  await page.click("[placeholder='Mobile / Business...']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".add-guest-btn");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
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
  await page.click("[name='Location travel policy']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(4) span");
  await page.click("[name='Payment Group']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > :nth-child(4)");
  await page.click("body > :nth-child(11) .btn--primary");
  await page.waitFor(500);
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
}

async function validate_can_proceed() {
  await page.click(".financial-section [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

