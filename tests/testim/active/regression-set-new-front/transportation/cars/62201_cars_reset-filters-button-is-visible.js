/*
 * Test Name: 62201  Cars - "Reset Filters" button is visible
 * Description: "Reset Filters" button is visible
 * Status: Active
 * Labels: Cars,Galileo,Regression,No Amadeus Hotel Book,Filters,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-19T06:10:29Z
 * Updated: 2025-09-14T11:57:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('galileo@gdgCorp.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_car_pick_up_and_drop_off_different('DFW', 'The Turf Hotel, Mold Road, Wrexham, UK');
  // Converting a 'html-attr-validation' step has to be done manually at this time
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Search_car_pick_up_and_drop_off_different(pickup, dropoff) {
  await page.click("[id='tab-car'] p");
  if (false) {
    await page.click("[id='pane-car'] .el-checkbox__inner");
  }
  await page.click("[input-class='pick-up']");
  await page.type("[input-class='pick-up']", pickup);
  await page.click(".autocomplete-result");
  if (false) {
    await page.click("[input-class='drop-off']");
  }
  if (false) {
    await page.type("[input-class='drop-off']", dropoff);
  }
  if (false) {
    await page.click(".autocomplete-result");
  }
  await page.click("#el-id-891-265");
  await page.waitForSelector("[id^='el-id'] .el-picker-panel__body", {state: "visible"});
  await page.click("[id='el-id-9377-806'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-id'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-9377-983");
  await page.click("[id='el-id-3400-128'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id^='el-id'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

