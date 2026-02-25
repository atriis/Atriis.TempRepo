/*
 * Test Name: 23072 MERGED Request Assistance - hotel params populated by the search + comments on hotel car and EU rail appear on requests + Financial reference does not appear on pop up if not assigned to the user group
 * Description: 
 * Status: Active
 * Labels: Request Assistance,No Amadeus Hotel Book,Regression,Hotel,Cars,NL government,Financial Reference Code,never failed,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
 * Owner: pini harush
 * Created: 2023-12-20T01:35:46Z
 * Updated: 2025-12-10T09:23:08Z
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
  await add_traveler_by_name('ofira refer');
  await hotel_search_params('london');
  await Request_assistance_button();
  await waitForText(page, "#el-id-474-946", /London/);
  await page.type("[placeholder='Comment (Optional)']", 'bla bla 2');
  await Request_assistance__car();
  await Request_assistance__euRail();
  await click_on_send_request();
  await validate_fields();
  await validate_can_proceed();
  await page.click(".btn-container > :nth-child(1)");
  await validate_comments();
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

async function hotel_search_params(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
}

async function Request_assistance_button() {
  await page.click(".page-view .icon-container");
}

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
}

async function old_1() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Time']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function Request_assistance__car(param) {
  await page.click(".btns-list > :nth-child(2) .icon-text");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", 'madrid');
  await page.click("[id='el-autocomplete-2486-item-1'] .has-text-weight-bold");
  await page.click("#el-id-5705-1159");
  await page.click("[aria-hidden='false'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-hidden='false'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await old();
  await page.click("[placeholder='Pick-up Time']");
  await page.type("[placeholder='Pick-up Time']", '10:00');
  await sendSpecialCharacter(page, "[placeholder='Pick-up Time']", 'Enter');
  await old_1();
  await page.click("#el-id-5705-1162");
  await page.click("[aria-hidden='false'] tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click("[placeholder='Drop-off Time']");
  await page.type("[placeholder='Drop-off Time']", '11:00');
  await sendSpecialCharacter(page, "[placeholder='Drop-off Time']", 'Enter');
  await page.click(".request-assistance-main > :nth-child(3) [placeholder='Comment (Optional)']");
  await page.type(".request-assistance-main > :nth-child(3) [placeholder='Comment (Optional)']", 'carrr 3');
}

async function Request_assistance__euRail() {
  await page.click(".btns-list > :nth-child(3) .icon-text");
  await page.type("[placeholder='From... Station or Location']", 'bruss');
  await page.click("#el-id-3390-1183-item-0 > div");
  await page.type("[placeholder='To... Station or Location']", 'paris');
  await page.click("#el-id-3390-1222-item-0 > div");
  await page.click("#el-id-153-1260");
  await page.click("[aria-hidden='false'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-hidden='false'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-153-1265");
  await page.click("[aria-hidden='false'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".request-assistance-main > :nth-child(4) [placeholder='Comment (Optional)']");
  await page.type(".request-assistance-main > :nth-child(4) [placeholder='Comment (Optional)']", 'railll4');
}

async function click_on_send_request() {
  await page.click(".btn--primary");
}

async function validate_fields() {
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(1) .label", 'Type of traveller      info');
  await waitForText(page, "[id='el-collapse-content-677'] .general-questions > :nth-child(2) .label", '*      Location travel policy      info');
  await waitForText(page, ".general-questions > :nth-child(3) .label", 'Location      info');
  await waitForText(page, "[id='el-collapse-content-8765'] .input-textbox .label", 'Personnel number      info');
  await waitForText(page, "#el-collapse-head-3605 > div > span", 'Ofira  Refer');
  await waitForText(page, "[id='el-collapse-content-4604'] .input-dropdown .label", '*      Payment Group      info');
  await waitForText(page, "[id='el-collapse-content-4604'] .input-textbox .label", 'Bank account      info');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_can_proceed() {
  await page.click("body > :nth-child(10) .btn--primary");
  await waitForText(page, ".success-message__title", 'Sent to agent');
}

async function validate_comments() {
  await waitForText(page, "[idx='0'] .center-title", /Requested hotel/);
  await waitForText(page, "[idx='0'] .active", 'bla bla 2');
  await waitForText(page, "[idx='1'] .center-title", /Requested car/);
  await waitForText(page, "[idx='1'] .active", 'carrr 3');
  await waitForText(page, "[idx='2'] .center-title", /Requested rail/);
  await waitForText(page, "[idx='2'] .active", 'railll4');
}

