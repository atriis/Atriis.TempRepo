/*
 * Test Name: 67021 City Center Search -  Stations status
 * Description: 
 * Status: Active
 * Labels: Cars,SunnyCars Regression,location,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-09-12T04:33:06Z
 * Updated: 2026-02-03T02:38:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('kaylesun@tlcfaketestsunnycar.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Copy_of_Search_car_by_place('Barcelona,Spain,(BCN)');
  await Answer_ref_fields_Chris_Tree_Fake_Test_and_proceed();
  await Stations_Status();
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

async function Copy_of_Search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-6388-623");
  await page.click("[id='el-id-3406-31'] .section-ampm > :nth-child(2)");
  await page.click("#el-id-9624-30");
  await page.click("#el-id-6388-646");
  await page.click("[id='el-id-1967-54'] .section-ampm > :nth-child(2)");
  await page.click("#el-id-9624-53");
  await page.waitFor(1000);
  await page.click(".search-btn");
  await old2();
  await old();
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Answer_ref_fields_Chris_Tree_Fake_Test_and_proceed() {
  await page.click("[name='TRIP PURPOSE']");
  await page.click("#el-id-4843-941 > span");
  await page.click("[id^='el-collapse-content'] .traveler-questions > :nth-child(1) [fill='currentColor']");
  await page.click("[id*='id'] span");
  await Click_on_proceed_after_search();
}

async function Station_Closed() {
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await waitForText(page, ".car-vendor-station-list > :nth-child(1) .station-details > :nth-child(2) > :nth-child(2) > :nth-child(3)", 'The station is closed on the selected dates and times');
  //TODO Please add an assertion here
await isVisible(page, ".car-vendor-station-list > :nth-child(1) .btn--primary");
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await page.click(".car-vendor-station-list > :nth-child(1) .btn--text");
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await waitForText(page, ".working-hours > :nth-child(2) > :nth-child(2)", 'The station is closed on the selected dates and times');
  await page.click("body > :nth-child(23) [xmlns='http://www.w3.org/2000/svg']");
}

async function Station_OnRequest() {
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await waitForText(page, ".car-vendor-station-list > :nth-child(5) .station-details > :nth-child(2) > :nth-child(2) > :nth-child(3)", 'The station can be opened on request on the selected dates and times');
  //TODO Please add an assertion here
await isVisible(page, ".car-vendor-station-list > :nth-child(5) .btn--primary");
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await page.click(".car-vendor-station-list > :nth-child(5) .btn--text");
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await page.click("body > :nth-child(23) [fill='currentColor']");
}

async function Station_Open() {
  await waitForText(page, ".car-vendor-station-list > :nth-child(9) .station-details > :nth-child(2) > :nth-child(2) > :nth-child(2)", 'The station is open on the selected dates and times');
  //TODO Please add an assertion here
await isVisible(page, ".car-vendor-station-list > :nth-child(9) .btn--primary");
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await page.click(".car-vendor-station-list > :nth-child(9) .btn--text");
  await waitForText(page, ".working-hours span", 'The station is open on the selected dates and times');
  await page.click("body > :nth-child(23) [xmlns='http://www.w3.org/2000/svg']");
}

async function Stations_Status() {
  await Station_Closed();
  await Station_OnRequest();
  await Station_Open();
}

