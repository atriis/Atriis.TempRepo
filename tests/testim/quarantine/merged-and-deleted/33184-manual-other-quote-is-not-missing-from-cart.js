/*
 * Test Name: 33184 Manual other quote is not missing from cart
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-07-12T11:45:34Z
 * Updated: 2023-11-28T11:22:02Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('manualQuote@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click(".is-capitalized");
  await page.click("#tab-manualOtherProducts > div");
  await page.click(".manual-quotes-form > :nth-child(1) [set='[object Object]'] .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.click("[id='pane-manualOtherProducts'] [placeholder='Select supplier']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.click(".start-from-input [type='text']");
  await page.click("[aria-label='Next Month']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(3) > td:nth-of-type(4) span");
  // Converting a 'drag' step has to be done manually at this time
  await page.type("[id='pane-manualOtherProducts'] .price-section [set='[object Object]'] [type='number']", '10');
  await page.click("[id='pane-manualOtherProducts'] [placeholder='Select type']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(4) [class^='px'], [class*=' px']");
  await page.click(".add-quote-btn");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
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

