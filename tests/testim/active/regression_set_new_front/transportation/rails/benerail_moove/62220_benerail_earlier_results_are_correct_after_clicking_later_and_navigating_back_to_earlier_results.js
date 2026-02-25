/*
 * Test Name: 62220 Benerail - Earlier results are correct after clicking 'Later' and navigating back to 'Earlier' results
 * Description: 
 * Status: Active
 * Labels: Benerail Moove Regression,Rail,results,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-20T07:45:15Z
 * Updated: 2026-01-21T10:00:45Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('justinbieber@benerailmoovenlgov.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Benerail_one_way('bebmi', 'schiphol airport (nl)');
  await click_on_proceed_after_search();
  await Checking_if_the_departure_time_is_from_06_00();
  await Click__Later__and_extracting_time();
  await Click__Earlier__and_extracting_time();
  await tst();
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

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
}

async function Search_Benerail_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("#el-id-3123-140");
  await page.click("[aria-label='Next Month']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await old2();
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function Checking_if_the_departure_time_is_from_06_00() {
  await Benerail___Results___Wait_for__Select__text();
  //TODO Please add an assertion here
await getText(page, ".rail-list > section:nth-of-type(1) .journey-details > section:nth-of-type(1) .has-text-weight-bold");
  await waitForText(page, ".rail-list > section:nth-of-type(1) .journey-details > section:nth-of-type(1) .has-text-weight-bold", new RegExp("^(0[6-9]|1[0-9]|2[0-3]):[0-5][0-9]$"));
}

async function Click__Later__and_extracting_time() {
  await page.click(".adjust-time-container > :nth-child(2) .has-text-weight-bold");
  await Benerail___Results___Wait_for__Select__text();
  //TODO Please add an assertion here
await getText(page, ".rail-list > section:nth-of-type(1) .journey-details > section:nth-of-type(1) .has-text-weight-bold");
}

async function Close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Click__Earlier__and_extracting_time() {
  await page.click(".adjust-time-container > :nth-child(1) .has-text-weight-bold");
  await Close_mandatory_notification();
  await Benerail___Results___Wait_for__Select__text();
  //TODO Please add an assertion here
await getText(page, ".rail-list > section:nth-of-type(1) .journey-details > section:nth-of-type(1) .has-text-weight-bold");
}

async function tst() {
  await page.evaluate(() => {
    console.log(resultsEarlier)
    console.log(resultsLater)
    
    function validateTimeIsLater() {
      if (resultsLater > resultsEarlier) {
        console.log(`Passed: "${resultsLater}" is later than "${resultsEarlier}".`);
      } else {
        throw new Error(`Failed: "${resultsLater}" is not later than "${resultsEarlier}".`);
      }
    }
    
    
    
  });
}

