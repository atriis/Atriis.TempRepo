/*
 * Test Name: 59265 Benerail - Travel Policy - OOP displayed when two rules are combined together
 * Description: 
 * Status: Active
 * Labels: Benerail Moove Regression,Travel policy,Rail,OOP,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-03-12T12:11:15Z
 * Updated: 2025-11-14T05:48:05Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('bruninabenerail@oop.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place('Berlin Hbf', 'BEBMI');
  await click_on_proceed_after_search();
  await Benerail___Results___Wait_for__Select__text();
  await OOP_displayed_when_two_rules_are_combined_together();
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

async function Click() {
  if (true) {
    return;
  }
  const boolean_1 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_1) {
    await page.click("[aria-label='Next Month']");
  }
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".from-row [placeholder='Date']", departureDate);
  await sendSpecialCharacter(page, ".from-row [placeholder='Date']", 'Enter');
  await page.click(".to-row [placeholder='Date']");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type(".to-row [placeholder='Date']", returnDate);
  await sendSpecialCharacter(page, ".to-row [placeholder='Date']", 'Enter');
}

async function Search_benerail_by_place(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.type("[placeholder='From... Station or Location']", from);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.type("[placeholder='To... Station or Location']", to);
  await page.waitForSelector(".autocomplete-result-text", {state: "visible"});
  await page.click(".autocomplete-result");
  await page.click(".from-row [placeholder='Date']");
  await page.click("[id='el-id-7687-293'] [aria-label='Next Month']");
  await page.click("[id='el-id-7687-293'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-7687-405");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    await page.click(".from-row [placeholder='Date']");
  }
  if (false) {
    //TODO Please add an assertion here
await getText(page, "[x-placement='bottom-start'] .el-date-picker__header");
  }
  await Click();
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(4)");
  }
  if (false) {
    await page.click(".to-row [placeholder='Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > :nth-child(5)");
  }
  await page.click(".search-btn");
  await old2();
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

async function OOP_displayed_when_two_rules_are_combined_together() {
  await page.click(".rail-list > section:nth-of-type(1) [class^='p'], [class*=' p']");
  await waitForText(page, ".rail-list > :nth-child(1) .ticket-bottom > :nth-child(1) > :nth-child(1) .btn--primary", 'Select');
  //TODO Please add an assertion here
await isVisible(page, ".rail-list > section:nth-of-type(1) .ticket-bottom > div:nth-of-type(1) > section:nth-of-type(5) .shield-icon");
  await page.hover(".rail-list > section:nth-of-type(1) .ticket-bottom > div:nth-of-type(1) > section:nth-of-type(5) .shield-icon");
  await waitForText(page, "#el-id-817-649 > ul > li", 'Duration is greater than 3 hours and Class Of Service is  first');
}

