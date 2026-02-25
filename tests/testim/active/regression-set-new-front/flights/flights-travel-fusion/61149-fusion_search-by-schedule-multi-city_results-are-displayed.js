/*
 * Test Name: 61149 Fusion - Search by Schedule Multi City - Results are displayed
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,Fusion,multi city,by schedule,results,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-23T07:25:08Z
 * Updated: 2025-09-14T10:46:29Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('mikeshinoda@travelfusion.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_multi_city_flight_by_schedule('BRS', 'Glasgow', 'Glasgow', 'AMS', 'BRS');
  await Validating_results_are_displayed();
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

async function Search_multi_city_flight_by_schedule(firstFrom, firstTo, secondFrom, secondTo, thirdTo) {
  await page.click("[id='tab-flight'] p");
  await page.click("[id='el-id-2216-47'] > :nth-child(3) .el-radio__label");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2216-72", firstFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-73", firstTo);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-89", secondFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-90", secondTo);
  await page.click(".autocomplete-result");
  await page.click("#el-id-2216-74");
  await page.click("#el-id-2216-65 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("[id='el-id-2216-65'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-2216-91");
  await page.click("[id='el-id-7014-88'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-7014-88'] tbody > :nth-child(4) > td:nth-of-type(6) .el-date-table-cell__text");
  await page.click(".add-flight-btn");
  await page.type("#el-id-1978-109", thirdTo);
  await page.click("#el-id-1978-99-item-0 > div");
  await page.click("#el-id-1978-110");
  await page.click("[id*='id'] tbody > :nth-child(6) > td:nth-of-type(1) .el-date-table-cell__text");
  await page.click("[id='el-id-1978-49'] > :nth-child(2) .el-radio__label");
  await page.click(".btn--primary");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function Validating_results_are_displayed() {
  await Flight___Results___Wait_for__Select__text();
  await waitForText(page, ".flight-list > :nth-child(1) .instant-purchase > :nth-child(2)", 'Instant Purchase');
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".ticket-details .is-align-items-end .loc-code", 'AMS');
  await waitForText(page, ".flight-list > :nth-child(1) .instant-purchase > :nth-child(2)", 'Instant Purchase');
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".flight-list > :nth-child(1) .ticket-details .is-align-items-end .loc-code", 'BRS');
  await waitForText(page, ".flight-list > :nth-child(1) .instant-purchase > :nth-child(2)", 'Instant Purchase');
  await page.click(".flight-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".flights-by-schedule-selected-segments .main-content > :nth-child(1) [class^='mr'], [class*=' mr']", 'BRS - GLA');
  await waitForText(page, ".flights-by-schedule-selected-segments .main-content > :nth-child(2) [class^='mr'], [class*=' mr']", 'GLA - AMS');
  await waitForText(page, ".last-segment [class^='mr'], [class*=' mr']", 'AMS - BRS');
}

