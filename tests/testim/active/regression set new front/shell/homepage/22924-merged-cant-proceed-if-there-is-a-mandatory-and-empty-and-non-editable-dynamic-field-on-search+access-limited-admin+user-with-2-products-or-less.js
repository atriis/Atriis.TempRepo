/*
 * Test Name: 22924 MERGED cant proceed if there is a mandatory and empty and non editable dynamic field on search + access limited admin + user with 2 products or less see "start new trip" button on homepage
 * Description: 
 * Status: Active
 * Labels: NL government,Dynamic fields,No Amadeus Hotel Book,Homepage,Products,Regression,Administration,Role,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-01T12:50:30Z
 * Updated: 2024-10-28T07:08:04Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('dina@Testimcorpnl.com');
  await validate_start_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_for_hotel_1_night('London');
  await page.waitFor(3000);
  await waitForText(page, ".help", 'This field is mandatory and blocked from editing. Please contact your administrator for assistance');
  await page.click("body > :nth-child(13)");
  await page.click("[id='el-collapse-content-63'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1375-72 > span");
  await page.click("body > :nth-child(13) .btn--primary");
  await page.waitFor(2000);
  await waitForText(page, ".help", 'This field is mandatory and blocked from editing. Please contact your administrator for assistance');
  await validate_limited_admin();
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

async function validate_start_new_trip() {
  await waitForText(page, ".imt-btn", 'Start New Trip');
  await page.click(".imt-btn");
  await waitForText(page, ".search-inputs-title", 'Book and stay at your hotel');
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

async function Search_for_hotel_1_night(where) {
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

async function limit_admin() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_limited_admin() {
  await page.click("[aria-describedby='el-tooltip-7590'] .material-symbols-outlined");
  await waitForText(page, "[title='Users']", /Users/);
  await waitForText(page, "[title='Point of Interest']", /Point of Interest/);
  await waitForText(page, "[title='Preferred Hotels']", /Preferred Hotels/);
  await waitForText(page, "[title='Quick Links']", /Quick Links/);
  await limit_admin();
}

