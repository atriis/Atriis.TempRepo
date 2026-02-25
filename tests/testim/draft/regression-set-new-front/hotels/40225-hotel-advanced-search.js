/*
 * Test Name: 40225 Hotel advanced search
 * Description: 
 * Status: Draft
 * Labels: Advanced search,search,Hotel,Galileo,Filters
 * Owner: pini harush
 * Created: 2023-12-19T11:39:51Z
 * Updated: 2024-05-16T07:36:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bsgalileoflight@galileoflight.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  //TODO Please add an assertion here
await isVisible(page, "[class^='pl'], [class*=' pl']");
  await Advanced_Search_hotel_1_night('lhr', 'radisson hotels');
  await waitForText(page, ".hotel-list > :nth-child(1) .price-suffix [class^='gray'], [class*=' gray']", /Room/);
  await waitForText(page, "[aria-describedby='el-tooltip-3919'] .ellipsis-txt", /Radisson/);
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

async function Advanced_Search_hotel_1_night(where, Chain) {
  await page.click("[id='tab-hotel'] p");
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  if (false) {
    await page.click("[id='el-autocomplete-2906-item-0'] .has-text-weight-bold");
  }
  await page.waitFor(500);
  await page.click(".autocomplete-result");
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  await page.click("[placeholder='Check in']");
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  await page.click(".el-icon-arrow-right");
  await page.click(".el-icon-arrow-right");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(3) span");
  await page.click(".end-date span");
  await page.click("[id='pane-hotel'] .btn");
  await page.click(".el-select__input");
  await page.type(".el-select__input", Chain);
  await page.click(".is-multiple .el-scrollbar__view > li:nth-of-type(302) span");
  await page.click(".is-6 [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(5)");
  await page.click(".is-2 [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(1)");
  await page.click(".search-btn");
}

