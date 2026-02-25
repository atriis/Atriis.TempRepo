/*
 * Test Name: 62001 Benerail - validate passenger details
 * Description: Validate passenger details
 * Status: Active
 * Labels: Full Purchase,Daily Transportation,Regression,Benerail Moove Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-08T02:15:02Z
 * Updated: 2026-02-06T03:27:06Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Testim@benemoove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_a_new_traveler___By_name('Secbene Moove');
  await Add_traveller___random_guest();
  await Search_Benerail_one_way('bebmi', 'nlasc');
  await Select_Container();
  await Passenger_Info();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
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

async function Add_a_new_traveler___By_name(name) {
  await page.click(".add-btn .material-symbols-outlined");
  await page.waitFor(300);
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Add_traveller___random_guest() {
  await page.waitForSelector("[aria-describedby^='el-tooltip']", {state: "visible"});
  await page.waitFor(1000);
  await page.click("[aria-describedby^='el-tooltip']");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-1-220 > span");
  await page.type("[placeholder='First Name']", 'David');
  await page.type("[placeholder='Last Name']", 'Kohler');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  await page.type("#el-id-1-249", 'israel');
  await page.click("#el-id-1-360 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'davidkohler@atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '+222' + "-" +'92' + "-" + '3456789');
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-1-240 > span");
  await page.click(".add-guest-btn");
  await waitForText(page, ".has-text-weight-semibold", 'David Kohler');
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
}

async function Search_Benerail_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("#el-id-3123-140");
  await page.click("[aria-label='Next Month']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await old2();
  await page.click(".search-btn");
}

async function Select_Container() {
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".btn--primary");
}

async function Validate_Passenger_info___Green() {
  await scrollToElement(page, ".eu-rail-passenger-info .extra__description");
  await waitForText(page, ".eu-rail-passenger-info .card-title", 'Passenger info 3/3');
  // Converting a 'css-prop-validation' step has to be done manually at this time
}

async function Validate_Guest() {
  await page.click(".eu-rail-passenger-info .is-clickable");
  await page.click("[id='tab-1774803'] p");
  await waitForText(page, "#el-id-2413-692", 'testim@benemoove.com');
  await waitForText(page, "#el-id-7005-657", 'Moove');
  await waitForText(page, "#el-id-7005-658", 'Bene');
}

async function Validate_Bene_Moove() {
  await Validate_Guest();
}

async function Validate_Guest_1() {
  await page.click("[id='tab-1774805'] p");
  await waitForText(page, "#el-id-2413-693", 'Kohler');
  await waitForText(page, "#el-id-2413-694", 'David');
  await waitForText(page, "#el-id-2413-698", 'davidkohler@atriistech.com');
}

async function Remove_guest_email() {
  await page.click("#el-id-1626-665");
  await page.type("#el-id-1626-665", '');
  await page.click(".tabs-container .btn--primary");
  // Converting a 'css-prop-validation' step has to be done manually at this time
}

async function Add_email() {
  await page.click("#el-id-1626-701");
  await page.type("#el-id-1626-701", 'davidkohler@atriistech.com');
  await page.click(".tabs-container .btn--primary");
}

async function Validate_Secbene_Moove() {
  await page.click(".eu-rail-passenger-info .is-clickable");
  await page.click("[id='tab-1774804'] p");
  await page.waitFor(300);
  await waitForText(page, "#el-id-7005-663", 'Moove');
  await waitForText(page, "#el-id-7005-664", 'Secbene');
  await waitForText(page, "#el-id-2413-698", 'testimsec@benemoove.com');
  await page.click(".tabs-container .btn--primary");
}

async function Add_traveller___guest() {
  await page.click(".travelers-list .has-text-weight-semibold");
  await page.waitFor(1000);
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-1-220 > span");
  await page.type("[placeholder='First Name']", 'Ellen');
  await page.type("[placeholder='Last Name']", 'Murphy');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  await page.type("#el-id-1-249", 'israel');
  await page.click("#el-id-1-360 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", 'ellen@atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '+322' + "-" +'92' + "-" + '445678');
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-1-240 > span");
  await page.click(".add-guest-btn");
}

async function Replace_corp_user() {
  await scrollToElement(page, ".travelers-list > :nth-child(3) .is-clickable");
  await page.click(".travelers-list > :nth-child(3) .is-clickable");
  await scrollToElement(page, ".extras-container > :nth-child(2)");
  //TODO Please add an assertion here
await isVisible(page, ".ticket-bottom");
  await scrollToElement(page, ".travelers-list > :nth-child(5) .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, ".travelers-list .has-text-weight-semibold");
  await Add_traveller___guest();
  await waitForText(page, ".travelers-list > section:nth-of-type(3) .traveler-name", 'Ellen Murphy');
  await page.waitFor(300);
}

async function Validate_new_Guest() {
  await scrollToElement(page, ".eu-rail-passenger-info .is-clickable");
  await page.click(".eu-rail-passenger-info .is-clickable");
  await page.waitFor(300);
  await page.click("[id='tab-1792484'] p");
  await waitForText(page, ".terms", 'Murphy');
  await waitForText(page, ".terms", 'Ellen');
  await waitForText(page, ".terms", 'ellen@atriistech.com');
  await page.click(".tabs-container .btn--primary");
}

async function Add_a_new_traveler___By_name_1(name) {
  await page.waitFor(300);
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Replace_guest_user() {
  await scrollToElement(page, ".travelers-list > :nth-child(2)");
  await page.click(".travelers-list > :nth-child(2) .is-clickable");
  await scrollToElement(page, ".extras-container > :nth-child(2)");
  //TODO Please add an assertion here
await isVisible(page, ".ticket-bottom");
  await scrollToElement(page, ".travelers-list > :nth-child(5)");
  await waitForText(page, ".travelers-list .has-text-weight-semibold", 'Select traveler');
  await page.click(".travelers-list .has-text-weight-semibold");
  await Add_a_new_traveler___By_name_1('Secbene Moove');
  await waitForText(page, ".travelers-list > section:nth-of-type(3) .traveler-name", 'Secbene Moove');
  await page.waitFor(300);
}

async function Validate_Secbene_Moove_1() {
  await scrollToElement(page, ".eu-rail-passenger-info .extra");
  await page.click(".eu-rail-passenger-info .is-clickable");
  await page.click("[id='tab-1774804'] p");
  await waitForText(page, "#el-id-7005-663", 'Moove');
  await waitForText(page, "#el-id-7005-664", 'Secbene');
  await waitForText(page, "#el-id-2413-698", 'testimsec@benemoove.com');
  await page.click(".tabs-container .btn--primary");
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Passenger_Info() {
  await page.click(".btn-container span");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await Validate_Passenger_info___Green();
  await Validate_Bene_Moove();
  await Validate_Guest_1();
  await Remove_guest_email();
  await Add_email();
  await Validate_Secbene_Moove();
  await Validate_Passenger_info___Green();
  await Replace_corp_user();
  await Validate_new_Guest();
  await Validate_Passenger_info___Green();
  await Replace_guest_user();
  await Validate_Secbene_Moove_1();
  await Validate_Passenger_info___Green();
  await Accept_and_proceed_to_checkout();
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Booker notification');
}

