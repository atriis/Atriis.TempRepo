/*
 * Test Name: 29722 Reference and dynamic fields on travel requests pop up are taken from the primary traveler - guest
 * Description: reference & dynamic fields on travel request pop up determined by primary traveler. in this test the primary is a guest - fields + content + editable + mandatory
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-02-01T02:54:59Z
 * Updated: 2023-06-04T12:14:29Z
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
  await click_on_send_request();
  await validate_fields();
  await validate_content();
  await validate_mandatory();
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
  await page.click(".traveler-name");
  await page.click(".add-guest-btn");
  await page.click("[role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.waitFor(500);
  await page.click(".copy-settings-container [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
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
  await waitForText(page, "[id='el-collapse-content-2678'] .label", '*      Type of Trip      info');
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(1) .label", 'Type of traveller      info');
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(2) .label", '*      Location travel policy      info');
  await waitForText(page, "[id='el-collapse-content-3471'] .general-questions > :nth-child(3) .label", 'Location      info');
  await waitForText(page, "[id='el-collapse-content-8765'] .input-textbox .label", 'Personnel number      info');
  await waitForText(page, "#el-collapse-head-2556 > div > span", 'Pini  Cohen');
  await waitForText(page, "[id='el-collapse-content-466'] .input-dropdown .label", '*      Payment Group      info');
  await waitForText(page, "[id='el-collapse-content-466'] .input-textbox .label", 'Bank account      info');
  await waitForText(page, "#el-collapse-head-3220 > div > span", 'Israel  Israeli');
  await waitForText(page, "[id='el-collapse-content-3254'] .input-dropdown .label", '*      Payment Group      info');
  await waitForText(page, "[id='el-collapse-content-3254'] .input-textbox .label", 'Bank account      info');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, "[name='Soort reis/Type of trip']", '');
  await waitForText(page, "[name='Type of traveller']", '');
  await waitForText(page, "[name='Location travel policy']", '');
  await waitForText(page, "[name='Location']", '');
  await waitForText(page, "[id='el-collapse-content-3471'] .input-textbox [type='text']", '');
  await waitForText(page, "[id='el-collapse-content-466'] [readonly='readonly']", '');
  await waitForText(page, "[id='el-collapse-content-466'] .input-textbox [type='text']", '');
  await waitForText(page, "[id='el-collapse-content-2556'] [readonly='readonly']", '');
  await waitForText(page, "[id='el-collapse-content-2556'] .input-textbox [type='text']", '');
}

async function validate_mandatory() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, "[id='el-collapse-content-3247'] .help", 'This field is required');
  await waitForText(page, "[id='el-collapse-content-6741'] .help", 'This field is required');
  await waitForText(page, "[id='el-collapse-content-7802'] .help", 'This field is required');
  await waitForText(page, "[id='el-collapse-content-7498'] .help", 'This field is required');
}

async function validate_editable_and_noneditable() {
  await page.click(".financial-section .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("[name='Type of traveller']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.click("[name='Location travel policy']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[name='Location']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(4)");
  await page.type("[id='el-collapse-content-6741'] .input-textbox [type='text']", '123');
  await page.click("[id='el-collapse-content-7802'] [readonly='readonly']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(2)");
  await page.type("[id='el-collapse-content-7802'] .input-textbox [type='text']", '456');
  await page.click(".is-danger [type='text']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > :nth-child(4)");
  await page.type("[id='el-collapse-content-7498'] .input-textbox [type='text']", '789');
  await waitForText(page, ".financial-section [type='text']", 'uploadname7 (uploadcode7)');
  await waitForText(page, "[name='Type of Trip']", 'Education and courses');
  await waitForText(page, "[name='Type of traveller']", 'Civil Expert');
  await waitForText(page, "[name='Location travel policy']", 'Caribbean');
  await waitForText(page, "[name='Location']", 'ACCRA');
  await waitForText(page, "[id='el-collapse-content-6741'] .input-textbox [type='text']", '123');
  await waitForText(page, "[id='el-collapse-content-7802'] [readonly='readonly']", 'ACC');
  await waitForText(page, "[id='el-collapse-content-7802'] .input-textbox [type='text']", '456');
  await waitForText(page, "[id='el-collapse-content-7498'] [readonly='readonly']", 'ALG');
  await waitForText(page, "[id='el-collapse-content-7498'] .input-textbox [type='text']", '789');
}

async function validate_can_proceed() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

