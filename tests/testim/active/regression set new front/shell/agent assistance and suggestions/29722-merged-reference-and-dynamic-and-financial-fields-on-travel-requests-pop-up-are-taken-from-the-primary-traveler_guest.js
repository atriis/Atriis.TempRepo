/*
 * Test Name: 29722 MERGED Reference and dynamic and financial fields on travel requests pop up are taken from the primary traveler - guest
 * Description: reference & dynamic and financial fields on travel request pop up determined by primary traveler. in this test the primary is a guest - fields + content + editable + mandatory
 * Status: Active
 * Labels: Reference Fields,Dynamic fields,NL government,Request Assistance,Regression,guest,performance,No Amadeus Hotel Book,Financial Reference Code,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-20T09:01:24Z
 * Updated: 2026-02-16T01:50:54Z
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
  await add_guest_Israel_Israeli___user_group_post_berlin();
  await add_second_traveler_by_name('pini cohen');
  await Request_assistance__hotel('London');
  await waitForText(page, ".add-more-services [class^='mb'], [class*=' mb']", 'Add more services');
  await scrollTo(page, 0, 186);
  await click_on_send_request();
  await validate_fields();
  await validate_content_1();
  await validate_mandatory();
  await validate_mandatory_1();
  await validate_editable_and_noneditable();
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

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function add_guest_Israel_Israeli___user_group_post_berlin() {
  await page.click(".add-btn .is-flex");
  await page.click(".add-guest-btn");
  await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.waitFor(500);
  await page.click(".copy-settings-container [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("[class^='mb'], [class*=' mb'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-7289-926 > span");
  await page.type("[placeholder='First Name']", 'Israel');
  await page.type("[placeholder='Middle Name']", 'Yakov');
  await page.type("[placeholder='Last Name']", 'Israeli');
  await page.click("[placeholder='DD/MM/YYYY']");
  await page.click(".show-year-arrows [aria-label='Previous Year'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".show-year-arrows tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".personal-info-container .is-transparent span");
  await page.type("#el-id-8141-954", 'israel');
  await page.click("#el-id-8141-1065 > span");
  await page.type("[placeholder='Enter email address']", 'israel@israeli.com');
  await page.type("[placeholder='Enter phone number']", '04-6548745');
  await page.click(".contact-info-container [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".add-guest-btn");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function add_second_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
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

async function validate_fields() {
  await waitForText(page, ".financial-section [class^='ml'], [class*=' ml']", '*');
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
  await waitForText(page, "[id='el-collapse-content-2678'] .label", /Type of Trip/);
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(1) .label", /Type of traveller/);
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(2) .label", /Location travel policy/);
  await waitForText(page, "[id='el-collapse-content-3471'] .general-questions > :nth-child(3) .label", /Location/);
  await waitForText(page, "[id='el-collapse-content-8765'] .input-textbox .label", /Personnel number/);
  await waitForText(page, "#el-collapse-head-2556 > div > span", 'Pini  Cohen');
  await waitForText(page, "[id='el-collapse-content-466'] .input-dropdown .label", /Payment Group/);
  await waitForText(page, "[id='el-collapse-content-466'] .input-textbox .label", /Bank account/);
  await waitForText(page, "#el-collapse-head-3220 > div > span", 'Israel  Israeli');
  await waitForText(page, "[id='el-collapse-content-3254'] .input-dropdown .label", /Payment Group/);
  await waitForText(page, "[id='el-collapse-content-3254'] .input-textbox .label", /Bank account/);
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, ".financial-section .el-select__placeholder span", 'Select');
  await page.click("[id='el-collapse-content-1289'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span", 'uploadname7 (uploadcode7)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span", 'uploadname5 (uploadcode5)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span", 'uploadname6 (uploadcode6)');
}

async function validate_content_1() {
  await validate_content();
  await waitForText(page, "[id='el-collapse-content-1295'] .control span", 'Select');
  await waitForText(page, "[id='el-collapse-content-1296'] .general-questions > :nth-child(1) .control span", 'Select');
  await waitForText(page, "[id='el-collapse-content-1296'] .general-questions > :nth-child(2) .control span", 'Select');
  await waitForText(page, "[id='el-collapse-content-1296'] .general-questions > :nth-child(3) .control span", 'Select');
  await waitForText(page, "[id='el-collapse-content-1298'] .el-select span", 'Select');
  await waitForText(page, "[title='568060'] span", 'CBKI');
}

async function validate_mandatory() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, "[id='el-collapse-content-3247'] .help", 'This field is required');
  await waitForText(page, "[id='el-collapse-content-6741'] .help", 'This field is required');
  await waitForText(page, "[id='el-collapse-content-7802'] .help", 'This field is required');
}

async function validate_mandatory_1() {
  await page.click("[id='el-collapse-content-1295'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1844-1312 > span");
  await page.click("[id='el-collapse-content-1296'] .is-danger [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1844-1335 > span");
  await page.click("[id='el-collapse-content-1298'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1844-1363 > span");
  await page.click("body > :nth-child(11) .btn--primary");
  await page.waitFor(500);
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
}

async function validate_editable_and_noneditable() {
  await page.click("[id='el-collapse-content-1289'] [fill='currentColor']");
  await page.click("#el-id-7896-1292 > span");
  await page.click("[id='el-collapse-content-1296'] .general-questions > :nth-child(1) [fill='currentColor']");
  await page.click("#el-id-7896-1323 > span");
  await page.click("[id='el-collapse-content-1296'] .general-questions > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-7896-1343 > span");
  await page.click("#el-id-7896-1304");
  await page.type("#el-id-7896-1304", '123');
  await page.click("#el-id-7896-1305");
  await page.type("#el-id-7896-1305", '456');
  await page.click("#el-id-7896-1306");
  await page.type("#el-id-7896-1306", '789');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".financial-section .el-select__placeholder span", 'uploadname7 (uploadcode7)');
  await waitForText(page, "[id='el-collapse-content-1295'] .control span", 'Education and courses');
  await waitForText(page, "[id='el-collapse-content-1296'] .general-questions > :nth-child(1) .control span", 'Civil Expert');
  await waitForText(page, "[id='el-collapse-content-1296'] .general-questions > :nth-child(2) .control span", 'Netherlands');
  await waitForText(page, "[id='el-collapse-content-1296'] .general-questions > :nth-child(3) .control span", 'ACCRA');
  await waitForText(page, "#el-id-7896-1304", '123');
  await waitForText(page, "[id='el-collapse-content-1298'] .el-select span", 'ALG');
  await waitForText(page, "#el-id-7896-1305", '456');
  await waitForText(page, "[title='568060'] span", 'CBKI');
  await waitForText(page, "#el-id-7896-1306", '789');
}

async function validate_can_proceed() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

