/*
 * Test Name: HYBRID for 62723 Travel Request/Request Assistance - Advanced flight search details can be viewed by Agent
 * Description: 
 * Status: Active
 * Labels: hybrid,Regression,Flights,Advanced search,Request Assistance,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-23T04:34:52Z
 * Updated: 2025-09-17T12:39:18Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Send_advance_search_flight_travel_request();
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


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Book_a_new_trip() {
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

async function If_Ref_Field__save() {
  await waitForText(page, "body > :nth-child(21) .btn--primary", 'Save');
  await page.click("body > :nth-child(21) .btn--primary");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Send_advance_search_flight_travel_request() {
  await Request_assistance_button();
  await waitForText(page, ".btn--text", /Advanced search/);
  await page.click("[class^='mt'], [class*=' mt']");
  await page.type("#el-id-2012-894", 'london');
  await page.click("[id='el-id-2012-312-item-0'] .has-text-weight-bold");
  await page.click("#el-id-2012-895");
  await page.click("[aria-hidden='false'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-hidden='false'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".departure .flex > :nth-child(4) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2012-322 > span");
  await page.click(".departure .class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2012-332");
  await page.click("[class^='ml'], [class*=' ml'] .el-checkbox__inner");
  await page.type("#el-id-2012-932", 'rome');
  await page.click(".autocomplete-result");
  await page.type("#el-id-2012-899", 'tel aviv');
  await page.click(".autocomplete-result");
  await page.click("#el-id-2012-900");
  await page.click("[aria-hidden='false'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".return .is-mobile > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2012-341");
  await page.click(".return .is-mobile > :nth-child(4) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2012-347 > span");
  await page.click(".return .class-input [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2012-355");
  await page.type("#el-id-2012-905", 'British Airways');
  await page.click("#el-id-2012-500");
  await page.click(".btn--primary");
  await If_Ref_Field__save();
  await waitForText(page, ".success-message__title", 'Sent to agent');
  await Click_Go_to_Trip();
  await waitForText(page, "#el-collapse-head-988 > h4", 'Travel request items');
  //TODO Please add an assertion here
await getText(page, ".trip-title");
}

