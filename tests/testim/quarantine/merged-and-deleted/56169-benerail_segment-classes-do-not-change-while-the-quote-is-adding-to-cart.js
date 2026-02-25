/*
 * Test Name: 56169 Benerail - Segment classes do not change while the quote is adding to cart
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2025-01-02T09:20:10Z
 * Updated: 2025-09-02T02:59:58Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('beny@moove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place('bebmi', 'schiphol airport (nl)');
  await Select_2nd_class_first_segment();
  await Select_1st_class_second_segment();
  await Classes_do_not_change_after_selecting_them();
  await Pending_booking___wait_for_element_text();
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
  const boolean_77 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_77) {
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

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function Select_2nd_class_first_segment() {
  await Benerail___Results___Wait_for__Select__text();
  await page.click(".rail-list > :nth-child(1) .btn--size-small");
  await waitForText(page, ".rules-list > :nth-child(1)", '2nd Class');
  await page.click("body > :nth-child(24) [xmlns='http://www.w3.org/2000/svg']");
  await Benerail___Results___Wait_for__Select__text();
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
}

async function Select_1st_class_second_segment() {
  await waitForText(page, ".btn--secondary", 'Change');
  await waitForText(page, ".rail-list > :nth-child(1) .btn--size-small", 'Fare Rules');
  await page.click(".rail-list > :nth-child(1) .btn--secondary");
  await waitForText(page, ".rail-list > :nth-child(1) .ticket-bottom > div:nth-of-type(1) > :nth-child(5) .alternative-description > :nth-child(1)", /1st Class/);
  await page.click(".rail-list > :nth-child(1) .ticket-bottom > :nth-child(1) > :nth-child(4) .btn--primary");
}

async function Classes_do_not_change_after_selecting_them() {
  await page.click(".eu-rail-results > :nth-child(1) > :nth-child(2) .btn--size-small");
  await waitForText(page, ".rules-list > :nth-child(1)", '2nd Class');
  await page.click("body > :nth-child(24) [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".eu-rail-results > :nth-child(1) > :nth-child(3) .btn--size-small");
  await waitForText(page, ".rules-list > :nth-child(1)", '1st Class');
  await page.click("body > :nth-child(26) [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".btn--primary");
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

