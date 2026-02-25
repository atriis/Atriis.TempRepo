/*
 * Test Name: 33157 restricted car rental agency should not appear in the results
 * Description: 
 * Status: Active
 * Labels: Regression,Cars,restriction,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-03-13T08:19:03Z
 * Updated: 2025-03-13T08:37:35Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.click("#tab-car > div");
  await page.click(".is-one-quarter-desktop [xmlns='http://www.w3.org/2000/svg']");
  await page.type("#el-id-7651-912", 'zt');
  await page.click("#el-id-7651-839");
  await search_car_by_place('Hato Intl. (CUR),Willemstad, Netherlands Antilles');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-7654-930");
  await click_on_proceed_after_search();
  await waitForText(page, "h3", 'No results found');
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

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function old() {
  if (true) {
    return;
  }
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  if (false) {
    await page.click("[placeholder='Pick-up Date']");
  }
  if (false) {
    await page.click("[aria-label='Next Month']");
  }
  if (false) {
    await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(2) span");
  }
  await page.click("#el-id-9250-87");
  await page.click("[id='el-id-3812-54'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-993-38 > span");
  await page.waitFor(1000);
  await page.click("[id='el-id-9786-26'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  if (false) {
    await page.click("#el-id-8716-55 > span");
  }
  await page.click("#el-id-7049-91 > span");
  await page.click("[id='el-id-2044-100'] .btn-apply");
  if (false) {
    await page.click("[placeholder='Drop-off Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(6) > td:nth-of-type(3) span");
  }
  await page.click("#el-id-9250-122");
  await page.waitFor(1000);
  await page.click("[id='el-id-9250-123'] [class^='mr'], [class*=' mr'] .el-select__wrapper");
  await page.click("#el-id-9198-139 > span");
  await page.click("[id='el-id-9198-123'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-8989-90 > span");
  await page.click("[id='el-id-9151-135'] .btn-apply");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
  await page.click(".search-btn");
}

async function search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click(".search-btn");
  await old2();
  await old();
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

