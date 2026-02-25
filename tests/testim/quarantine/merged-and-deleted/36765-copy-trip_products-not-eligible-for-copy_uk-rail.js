/*
 * Test Name: 36765 Copy Trip - Products not eligible for copy - uk rail
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-10-10T12:18:32Z
 * Updated: 2025-03-04T01:18:48Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('rail@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi__one_way_searchSOU_OXF();
  await waitForText(page, ".title-container h3", 'Outbound');
  await page.click(".green");
  await page.waitFor(300);
  await page.click(".btn--primary");
  await waitForText(page, ".text--bold", 'Pending booking');
  await click_on_copy_trip();
  await waitForText(page, ".quote-details-container .regular-text", 'This item can not be copied');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click("[aria-label='Copy trip'] .el-dialog__close");
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

async function UK_Rail__Evolvi__one_way_searchSOU_OXF() {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", 'SOU');
  await sendSpecialCharacter(page, "#el-id-7815-174", 'Tab');
  if (false) {
    await page.click("[id='el-id-2019-156-item-0'] .autocomplete-result-text");
  }
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", 'OXF');
  await sendSpecialCharacter(page, "#el-id-7815-175", 'Tab');
  if (false) {
    await page.click("[id='el-id-3128-129'] .autocomplete-result-text");
  }
  await page.click("[placeholder='Pick-up date']");
  await page.dblclick("[id='el-id-5703-1150'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-5703-1150'] tbody > :nth-child(4) > :nth-child(5)");
  await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  await page.click(".search-btn");
}

async function click_on_copy_trip() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#el-id-1344-210 > li:nth-child(2)");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

