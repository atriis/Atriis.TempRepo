/*
 * Test Name: 27016 Amadeus - Correct agreement tooltip and the logo are shown after change
 * Description: 
 * Status: Active
 * Labels: Administration,Regression,Flights,Amadeus,Agreement,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-03-10T05:27:20Z
 * Updated: 2025-12-10T11:11:38Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('change@tooltip.com');
  await Click_on_administration();
  await Admin();
  await book_a_new_trip();
  await Test();
  await Admin_1();
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

async function Click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
}

async function Admin() {
  await waitForText(page, "[settings='settings'] > :nth-child(1) > :nth-child(1) label", 'Address');
  await page.click("[title='Agreements']");
  await page.click(".ui-dialog-buttonset > :nth-child(1)");
  await waitForText(page, "[data-ng-click='onAddNewAgreementClicked()'] span", 'Add New Agreement');
  await page.click("[title='PTC Special Fares']");
  await waitForText(page, "[data-ng-repeat='corporateAgreement in corporateAgreements | filter:agreementSearchText'] > :nth-child(2) .ng-binding", 'SEA');
  await page.click("[data-ng-repeat='corporateAgreement in corporateAgreements | filter:agreementSearchText'] > :nth-child(1) .ng-binding");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("[name='ToolTip']", randomValue);
  await scrollToElement(page, "[data-ng-show='viewMode==ViewMode.Ready'] > :nth-child(5)");
  await page.type("[ng-required='isCommentRequired()']", 'regression');
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast", /succeeded/);
  await page.waitFor(3000);
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function code() {
  await page.evaluate(() => {
    const actualTooltip = String(tooltip).trim();
    const valueToCheck = String(randomValue).trim();
    
    if (actualTooltip.toLowerCase().includes(valueToCheck.toLowerCase())) {
      console.log("The string contains the value of 'randomValue'.");
    } else {
      throw new Error(`The string "${actualTooltip}" does not contain the value "${valueToCheck}".`);
    }
    
  });
}

async function Tool_tip_validation() {
  await code();
}

async function Test() {
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('CDG', 'LOS');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Flight___Click__Pricing_Options_();
  await page.hover(".flicking-camera > section:nth-of-type(1) .agreement-icon");
  //TODO Please add an assertion here
await getText(page, "[id*='id'] > :nth-child(1)");
  await Tool_tip_validation();
}

async function Admin_1() {
  await page.type("[name='ToolTip']", 'marine fare');
  await scrollToElement(page, "[data-ng-show='viewMode==ViewMode.Ready'] > :nth-child(5)");
  await page.type("[ng-required='isCommentRequired()']", 'regression');
  await page.click("[data-ng-click='onSaveClicked()']");
  await waitForText(page, ".toast", /succeeded/);
  await page.waitFor(3000);
  await waitForText(page, "[name='ToolTip']", 'marine fare');
}

