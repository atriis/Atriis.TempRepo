/*
 * Test Name: 38312 transferz - can search for "all types" and filter by the type
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-11-08T11:08:34Z
 * Updated: 2023-11-13T06:15:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('ran@ferz.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click("[id='tab-groundService'] p");
  await search_for_transferz();
  await page.click("body > :nth-child(18) .btn--primary");
  await page.click(".view-more-btn");
  await waitForText(page, ".app-filter__content > :nth-child(4) h4", /Vehicle/);
  await page.waitFor(1000);
  await filter_by_vehicle_type();
  await validate_results_by_the_filter();
  await filter_by_vehicle_type_1();
  await filter_by_vehicle_type___Business_limosine();
  await validate_results_by_the_filter_1();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
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

async function search_for_transferz() {
  await page.click("[placeholder='Pick-up... search airport']");
  await page.type("[placeholder='Pick-up... search airport']", 'ams');
  await page.click("[id='el-autocomplete-3953-item-0'] .has-text-weight-bold");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", 'amsterdan centraal railway station');
  await page.click("[id='el-autocomplete-7682-item-0'] p");
  await page.click("[placeholder='Today']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(4) span");
  await page.click("[placeholder='Pick-up time']");
  await page.click(".time-select .el-scrollbar__view > :nth-child(3)");
  await page.click("[placeholder='Vehicle Type']");
  await page.type("[placeholder='Vehicle Type']", 'all types');
  await page.click("[x-placement='top-start'] .el-scrollbar__view > li:nth-of-type(32) span");
  await page.click("[placeholder='1 Traveller']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > :nth-child(2)");
  await page.click(".search-btn");
}

async function filter_by_vehicle_type() {
  if (await getText(page, "[title='Business limousine']") === "/Business limousine/") {
    await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
  }
}

async function validate_results_by_the_filter() {
  await waitForText(page, ".ground-transport-desc", /Business limousine/);
}

async function filter_by_vehicle_type_1() {
  if (await getText(page, "[title='Business limousine']") === "/Minivan/") {
    await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
  }
}

async function filter_by_vehicle_type___Business_limosine() {
  if (await getText(page, "[title='Business limousine']") === "/Business limousine/") {
    await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
  }
}

async function validate_results_by_the_filter_1() {
  await waitForText(page, ".ground-transport-desc", /Minivan/);
}

