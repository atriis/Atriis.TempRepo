/*
 * Test Name: 37104 MERGED reference and dynamic and financial on travel request pop up are taken from the primary traveler (booker) + cc email is sent
 * Description: 
 * Status: Active
 * Labels: Request Assistance,Email,Regression,Reference Fields,Dynamic fields,NL government,No Amadeus Hotel Book,Financial Reference Code,Hotel,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-12T12:50:10Z
 * Updated: 2026-02-10T05:14:39Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await send_request_assistance();
  await validate_fields();
  await validate_content();
  await validate_editable_and_noneditable();
  await validate_mandatory();
  await validate_mandatory_1();
  await validate_can_proceed();
  await validate_cc_email(generatedEmail, 'shaninl@atriis.com');
  await validate_email_subject();
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

async function Request_assistance_button() {
  await page.click(".page-view .icon-container");
}

async function send_request_assistance() {
  await Request_assistance_button();
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", 'lon');
  await page.click("[id='el-autocomplete-7653-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", 'par');
  await page.click("[id='el-autocomplete-871-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-icon-arrow-right");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(4) span");
  await page.click(".end-date span");
  await page.click("[placeholder='Send CC Email (optional)']");
  // Converting a 'email-generator' step has to be done manually at this time
  await page.type("[placeholder='Send CC Email (optional)']", generatedEmail);
  await page.click(".btn--primary");
}

async function validate_fields() {
  await waitForText(page, ".financial-section [class^='ml'], [class*=' ml']", '*');
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
  await waitForText(page, "[id='el-collapse-content-5514'] .label", '*Soort reis/Type of tripinfo');
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(1) .label", 'Type of travellerinfo');
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(2) .label", '*Location travel policyinfo');
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(3) .label", 'Locationinfo');
  await waitForText(page, "[stage='0'] .label", '*Payment Groupinfo');
  await waitForText(page, ".input-textbox .label", 'Bank accountinfo');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, ".financial-section .el-select__placeholder", 'Select');
  await page.click(".financial-section .el-select__caret");
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span", 'uploadname10 (uploadcode10)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span", 'uploadname9 (uploadcode9)');
  await waitForText(page, "[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span", 'uploadname8 (uploadcode8)');
  await waitForText(page, "[id='el-collapse-content-946'] .el-select__placeholder", 'Select');
  await waitForText(page, "[id='el-collapse-content-947'] .general-questions > :nth-child(1) .el-select__selected-item", 'Select');
  await waitForText(page, "[title='568027'] .el-select__selected-item", 'Caribbean');
  await waitForText(page, "[id='el-collapse-content-947'] .general-questions > :nth-child(3) .el-select__selected-item", 'Select');
  await waitForText(page, ".traveler-section .el-select__selected-item", 'ADD');
}

async function validate_editable_and_noneditable() {
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.type("#el-id-1556-952", '123');
  await waitForText(page, ".input-textbox [type='text']", '123');
  if (false) {
    await page.click(".financial-section [type='text']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  }
  if (false) {
    await waitForText(page, ".financial-section [type='text']", 'uploadname10 (uploadcode10)');
  }
}

async function validate_mandatory() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".help", 'This field is required');
}

async function validate_mandatory_1() {
  await page.click("[id='el-collapse-content-946'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-7602-957 > span");
  await page.click("body > :nth-child(10) .btn--primary");
  await page.waitFor(500);
  await waitForText(page, ".financial-section .has-text-weight-semibold", 'Financial Reference');
}

async function validate_can_proceed() {
  await page.click("[id='el-collapse-content-940'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6185-944 > span");
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

async function validate_cc_email(expectedCcAdress, expectedToAdress) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function validate_email_subject() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

