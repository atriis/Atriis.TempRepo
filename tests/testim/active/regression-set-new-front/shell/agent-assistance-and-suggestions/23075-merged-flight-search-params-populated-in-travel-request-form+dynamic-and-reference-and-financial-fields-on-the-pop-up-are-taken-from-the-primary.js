/*
 * Test Name: 23075 MERGED flight search params populated in travel request form + dynamic and reference and financial fields on the pop up are taken from the primary user (different from the booker)
 * Description: parameters in travel request form should be pre-populated according to the data entered in the flight search page + the reference and dynamic anf financial fields on travel request pop up should be taken from the primary traveler (in this case user with user group that s different from the booker)
 * Status: Active
 * Labels: Request Assistance,Flights,No Amadeus Hotel Book,Regression,Reference Fields,NL government,Financial Reference Code,Dynamic fields,Search Flight,never failed,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-20T10:14:46Z
 * Updated: 2026-02-16T01:39:50Z
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
  await Add_traveler___I_am_the_traveler();
  await add_second_traveler_by_name___primary('Gadi cohen');
  await fill__flights_parameters('lon', 'tlv');
  await page.click(".page-view .icon-container");
  await waitForText(page, "[placeholder='From... Departure']", from);
  await waitForText(page, "[placeholder='To... Destination']", to);
  await waitForText(page, "[placeholder='Depart Date']", fromDate);
  await waitForText(page, "[placeholder='Return Date']", toDate);
  await waitForText(page, ".el-select__selection span", 'Premium Economy');
  await waitForText(page, ".travelers-list > section:nth-of-type(2) .traveler-name", 'Shani Cohen');
  await waitForText(page, ".travelers-list > :nth-child(1) .traveler-name", 'Gadi Cohen');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await click_on_send_request();
  await validate_fields();
  await validate_content_1();
  await validate_editable_and_noneditable();
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

async function fill__flights_parameters(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3827-85", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3827-86", 'Tab');
  await page.click(".class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6798-43 > span");
  await page.click("[placeholder='Depart Date']");
  await page.click("[id='el-id-846-67'] .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  //TODO Please add an assertion here
await getText(page, "[placeholder='From... Departure']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='To... Destination']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Depart Date']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Return Date']");
  //TODO Please add an assertion here
await getText(page, ".class-input .el-select__selection span");
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
  await waitForText(page, "[id='el-collapse-content-8765'] .input-textbox .label", /Personnel number/);
  await waitForText(page, "#el-collapse-head-4604 > div > span", 'Gadi  Cohen');
  await waitForText(page, "[id='el-collapse-content-4604'] .input-dropdown .label", /Payment Group/);
  await waitForText(page, "[id='el-collapse-content-4604'] .input-textbox .label", /Bank account/);
  await waitForText(page, "#el-collapse-head-1570 > div > span", 'Shani  Cohen');
  await waitForText(page, "[id='el-collapse-content-3254'] .input-dropdown .label", /Payment Group/);
  await waitForText(page, "[id='el-collapse-content-3254'] .input-textbox .label", /Bank account/);
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, ".financial-section .el-select__placeholder span", 'Select');
  await page.click("[id='el-collapse-content-946'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "#el-id-257-949 > span", 'uploadname3 (uploadcode3)');
  await waitForText(page, "#el-id-257-950 > span", 'uploadname4 (uploadcode4)');
}

async function validate_content_1() {
  await validate_content();
  await waitForText(page, "[id='el-collapse-content-951'] .control span", 'Select');
  await waitForText(page, "[title='568024'] span", 'External employee');
  await waitForText(page, "[title='568030'] span", 'Netherlands');
  await waitForText(page, "[title='568056'] span", 'ACC');
  await waitForText(page, "#el-id-257-961", '456');
  await waitForText(page, "[title='568057'] span", 'ADD');
}

async function validate_editable_and_noneditable() {
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.type("#el-id-257-961", '123');
  await page.type("#el-id-257-962", '565');
  await waitForText(page, "#el-id-257-961", '123');
  await waitForText(page, "#el-id-257-962", '565');
}

async function validate_mandatory() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".help", 'This field is required');
  await page.click("[id='el-collapse-content-951'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4212-968 > span");
  await page.click("body > :nth-child(10) .btn--primary");
  await page.waitFor(500);
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
}

async function validate_can_proceed() {
  await page.click("[id='el-collapse-content-946'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4212-950 > span");
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

