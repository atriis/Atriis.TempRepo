/*
 * Test Name: 33007 Manual quotes - PerDiem with upload file to quote
 * Description: 
 * Status: Active
 * Labels: Regression,Manual Quote,No Amadeus Hotel Book,Pre Prod,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-07-06T12:58:05Z
 * Updated: 2025-08-19T01:32:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('manualQuote@testim.com');
  if (false) {
    await waitForText(page, ".marginEightee > div:nth-of-type(2) span", 'How would you like to start your next trip');
  }
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_Manual_Quote___Other();
  await Enter_Quote_Details();
  await Upload_File_to_Quote();
  await page.waitFor(2000);
  await Validate_file_upload();
  await page.waitFor(2000);
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

async function Select_Manual_Quote___Other() {
  await page.click("#tab-manual > div");
  await waitForText(page, "h1", 'Add Manual Quote');
  await page.click("#tab-manualOtherProducts > div");
}

async function Enter_Quote_Details() {
  await waitForText(page, ".manual-quotes-form > :nth-child(1) > :nth-child(1) .label", 'Select quote type*');
  await page.click(".manual-quotes-form > :nth-child(1) [set='[object Object]'] .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(4) span");
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("#el-id-2698-776");
  await page.type("#el-id-2698-776", fromDate);
  await page.click("#el-id-2698-777");
  await page.type("#el-id-2698-777", toDate);
  await page.click("#el-id-314-1857");
  await page.type("#el-id-314-1857", '3 full days');
  await page.click("[id='pane-manualOtherProducts'] .price-section > :nth-child(1) [type='number']");
  await page.type("[id='pane-manualOtherProducts'] .price-section > :nth-child(1) [type='number']", '350');
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
}

async function Upload_File_to_Quote() {
  await page.click("#el-collapse-head-8254");
  await page.click(".ticket-layout-container .is-clickable");
  // Converting a 'drop-file' step has to be done manually at this time
  await waitForText(page, "[class^='pt'], [class*=' pt']", 'benerail_cxl_GPWNLGC.pdf');
  await page.click(".btn--primary");
}

async function Validate_file_upload() {
  await page.click(".ticket-layout-container .is-clickable");
  //TODO Please add an assertion here
await isVisible(page, ".existing-files-list .is-clickable");
  await waitForText(page, "[class^='pt'], [class*=' pt']", 'benerail_cxl_GPWNLGC.pdf');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

