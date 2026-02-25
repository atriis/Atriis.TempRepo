/*
 * Test Name: 62893 Galileo - Advanced Search - "Search" button works for multicity flight and hotel search
 * Description: 
 * Status: Active
 * Labels: Regression,Galileo,Flights,Advanced search,multi city,Hotel,multiproducts,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-06-03T07:47:33Z
 * Updated: 2025-09-14T12:47:02Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("bsgalileoflight@galileoflight.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_multi_city('SAL', 'MEX', 'MEX', 'GDL', 'GDL', 'SAL');
  await Flight___Results___Wait_for__Select__text();
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

async function Search_flights_multi_city(firstFrom, firstTo, secondFrom, secondTo, thirdFrom, thirdTo) {
  await page.click("[id='tab-flight'] p");
  await page.click("[id='el-id-2216-47'] > :nth-child(3) .el-radio__label");
  await page.click("[id='el-id-2743-266'] > :nth-child(2) .el-radio__label");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2216-72", firstFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-73", firstTo);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-89", secondFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-90", secondTo);
  await page.click(".autocomplete-result");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2743-367", thirdFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2743-368", thirdTo);
  await page.click("#el-id-2743-358-item-0 > div");
  await page.click("#el-id-4227-300");
  await page.click("[id='el-id-4227-291'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-4227-291'] tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.waitFor(1500);
  await page.click("#el-id-4227-317");
  await page.click("[id='el-id-4227-308'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.waitFor(1500);
  await page.click("#el-id-4227-334");
  await page.click("[id='el-id-4227-325'] [aria-label='Next Month']");
  await page.click("[id='el-id-4227-325'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".is-align-flex-start .el-checkbox__inner");
  await page.click(".is-align-self-flex-start span");
  await page.click(".btn--primary");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

