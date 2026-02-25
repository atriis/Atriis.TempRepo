/*
 * Test Name: 37964 Ref field auto complete and dependency
 * Description: 
 * Status: Active
 * Labels: Regression,Reference Fields,Manual Quote,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-11-06T09:59:16Z
 * Updated: 2025-09-14T08:51:00Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('will@mref.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click(".is-capitalized");
  await page.click("#tab-hotel > div");
  await page.click("[placeholder='Search by hotel name, city name or landmark']");
  await page.type("[placeholder='Search by hotel name, city name or landmark']", 'lhr');
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click(".search-hotel-btn");
  await waitForText(page, ".hotel-results > :nth-child(1) .btn", 'Choose');
  await page.click(".hotel-results > :nth-child(1) .btn");
  await page.click("[placeholder='City']");
  await page.type("[placeholder='City']", 'london');
  await page.click("[id='el-id-5754-2042-item-0'] p");
  await page.click("[id='pane-hotel'] .manual-quote-form > :nth-child(3) > :nth-child(1) [type='text']");
  await page.click("[id='el-id-6574-2293'] [aria-label='Next Month']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("#el-id-8770-2548");
  await page.click("[id='el-id-8770-2294'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[id='pane-hotel'] [placeholder='Confirmation Number']");
  await page.type("[id='pane-hotel'] [placeholder='Confirmation Number']", '1234');
  await page.click("[placeholder='Room description']");
  await page.type("[placeholder='Room description']", 'metallica');
  await page.click(".add-quote-btn");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'On hold');
  await page.click(".btn-container span");
  await waitForText(page, ".general-section .label", 'BILLABLE OR NON BILLABLE');
  await page.click("[id='el-collapse-content-3988'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1293-3995");
  await page.click("[role='textbox']");
  await page.type("[role='textbox']", '33');
  await page.waitForSelector("#el-id-1293-3998-item-0 > div", {state: "visible"});
  await page.click("#el-id-1293-3998-item-0 > div");
  await waitForText(page, "[role='textbox']", /3/);
  await page.click(".cart-btn .material-symbols-outlined");
  await waitForText(page, ".quote-title", /Nights/);
  await Trip_Cancelation();
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

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

