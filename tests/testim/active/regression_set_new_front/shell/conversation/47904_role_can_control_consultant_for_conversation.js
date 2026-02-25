/*
 * Test Name: 47904 role can control consultant for conversation
 * Description: 
 * Status: Active
 * Labels: Regression,Role,Privileges,trip conversation,Daily Shell,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-07-07T11:28:23Z
 * Updated: 2026-01-26T03:20:08Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('gadi@Testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('mali cohen');
  await Search_hotel_1_night('MAD');
  await click_on_proceed_after_search();
  await page.click(".chat-btn .material-symbols-outlined");
  await page.click(".chat-main .btn-container span");
  await page.click(".agent-btn");
  await page.click(".traveler-name");
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function old() {
  if (true) {
    return;
  }
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
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

