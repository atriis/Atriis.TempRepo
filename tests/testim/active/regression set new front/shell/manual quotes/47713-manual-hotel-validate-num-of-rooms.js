/*
 * Test Name: 47713- Manual Hotel validate num of rooms
 * Description: 
 * Status: Active
 * Labels: Manual Quote,No Amadeus Hotel Book,Hotel,multi pax,Regression,Daily Hotels,2026 plan 1
 * Owner: pini harush
 * Created: 2024-06-26T02:03:36Z
 * Updated: 2026-02-09T11:16:59Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('manualQuote@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_second_traveler___By_name__2026('noam ypsilon');
  await Add_third_traveler___By_name__2026('noam');
  await add_fourth_traveler();
  await Add_hotel_manual_quote();
  await page.click(".page-view a > :nth-child(1)");
  await waitForText(page, ".total-for-rooms", 'Total for  4 Rooms');
  await page.click(".el-drawer__open .btn");
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-7191 > li:nth-child(1)");
  await page.click(".radio-btns > :nth-child(2) .el-radio__inner");
  await waitForText(page, "[width='63%'] > :nth-child(1) > :nth-child(1) > :nth-child(3) tr > :nth-child(2) > :nth-child(1)", 'Number of guests: 4');
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

async function scrollToElement(page, selector) {
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  }, selector);
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

async function Add_second_traveler___By_name__2026(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("h2");
  if (false) {
    await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  }
  if (false) {
    // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  }
  await page.waitFor(2000);
}

async function Add_third_traveler___By_name__2026(name) {
  await page.waitFor(2000);
  await page.click(".add-btn .is-flex");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("#el-id-5736-287-item-0 > div");
  await page.waitForSelector(".travelers-list > section:nth-of-type(2) .traveler-name", {state: "visible"});
}

async function add_fourth_traveler() {
  await page.click(".add-btn .is-flex");
  await page.click("#el-id-8747-925");
  await page.type("#el-id-8747-925", 'noam');
  await page.click("[id='el-id-8747-921-item-0'] h2");
}

async function add_3_pax_more() {
  if (true) {
    return;
  }
  await page.click("[aria-describedby='el-tooltip-8681']");
  await page.click(".has-text-weight-semibold");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'noam ypsilon');
  await page.click("#el-id-3523-3459-item-0");
  await page.waitFor(5000);
  await scrollToElement(page, "[aria-describedby='el-tooltip-8681']");
  await page.click("[aria-describedby='el-tooltip-8681']");
  await page.waitFor(1000);
  await page.click(".has-text-weight-semibold");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'noam');
  await page.click("[id='el-autocomplete-8504-item-1'] h2");
  await page.waitFor(5000);
  await page.click("[aria-describedby='el-tooltip-8681']");
  await page.waitFor(1000);
  await page.click(".has-text-weight-semibold");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'noam');
  await page.click("#el-id-3523-3966-item-0");
  await page.waitFor(5000);
}

async function Add_hotel_manual_quote() {
  await page.click(".is-capitalized");
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[id='tab-hotel'] p");
  await page.click("[placeholder='Search by hotel name, city name or landmark']");
  await page.type("[placeholder='Search by hotel name, city name or landmark']", 'PDX');
  await page.click("[id='el-autocomplete-9155-item-0'] .has-text-weight-bold");
  await page.click(".search-hotel-btn");
  await waitForText(page, ".hotel-results > :nth-child(1) .btn", 'Choose');
  await page.click(".hotel-results > :nth-child(3) .btn");
  await add_3_pax_more();
  await page.click("[id='pane-hotel'] .manual-quote-form > :nth-child(3) > :nth-child(3) .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("#el-id-1703-2083");
  await page.type("#el-id-1703-2083", 'london');
  await page.click("#el-id-5602-2207");
  await page.click("#el-id-5602-1953 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-5602-2208");
  await page.click("[id='el-id-5602-1954'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  if (false) {
    await page.type("#el-id-4280-1202", hotelFromDate);
  }
  if (false) {
    await sendSpecialCharacter(page, "#el-id-4280-1202", 'Enter');
  }
  if (false) {
    await page.type("#el-id-4280-1203", hotelToDate);
  }
  if (false) {
    await sendSpecialCharacter(page, "#el-id-4280-1203", 'Enter');
  }
  await page.click("[data-gtm-form-interact-id='0'] > :nth-child(3) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1703-3765 > span");
  await page.click("[data-gtm-form-interact-id='0'] > :nth-child(4) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1703-1886 > span");
  await page.click("#el-id-1703-2091");
  await page.type("#el-id-1703-2091", '445566');
  await page.click("#el-id-1703-2092");
  await page.type("#el-id-1703-2092", 'testim');
  await page.click(".add-quote-btn");
  await waitForText(page, ".btn-container span", 'Proceed to Checkout');
}

