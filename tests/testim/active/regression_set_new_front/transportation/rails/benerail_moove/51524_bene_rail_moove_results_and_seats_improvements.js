/*
 * Test Name: 51524 Bene rail Moove> results and seats improvements
 * Description: check improvements on results page (earlier and later)
and seats
 * Status: Active
 * Labels: No Amadeus Hotel Book,Benerail Moove Regression,Bene seats,Rail,Transportation,2026 plan 1
 * Owner: pini harush
 * Created: 2024-09-08T02:15:43Z
 * Updated: 2025-09-02T05:00:45Z
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
  await Search_benerail_by_place('DEFRA', 'BEBMI');
  await click_on_proceed_after_search();
  await Bene__check_results_page();
  await Seating_not_visible_in_price();
  await Bene__validate_seats__TBD();
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

async function Click() {
  if (true) {
    return;
  }
  const boolean_15 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_15) {
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

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_benerail_2_ways_from_search_results_to_cart() {
  await page.waitForSelector(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", {state: "visible"});
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await page.click(".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']");
  await page.waitFor(3000);
  await page.click(".rail-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await page.click(".add-rail-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Bene__check_results_page() {
  await Benerail___Results___Wait_for__Select__text();
  await waitForText(page, ".eu-rail-stepper", /(06:00|07:00|08:00)/);
  await page.click(".adjust-time-container > :nth-child(2) .text--bold");
  await Benerail___Results___Wait_for__Select__text();
  await waitForText(page, ".eu-rail-stepper", /(16:00|17:00|18:00)/);
  await add_benerail_2_ways_from_search_results_to_cart();
  await Pending_booking___wait_for_element_text();
}

async function Seating_not_visible_in_price() {
  await scrollToElement(page, ".seats .is-clickable");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function validate_number1_number2_number3(number1, number2, number3) {
  await page.evaluate((number1, number2, number3) => {
    let numA = parseFloat(number1);
    let numB = parseFloat(number2);
    let numC = parseFloat(number3);
    
    if (Math.round(numA + numB) === Math.round(numC)) {
        console.log("number 1 is"+ number1 +", number 2 is"+ number2+", number 3 is"+ number3+". The rounded sum of number1 and number2 is equal to the rounded number3.");
    } else {
        throw new Error("number 1 is"+ number1 +", number 2 is"+ number2+", number 3 is"+ number3+". The rounded sum of number1 and number2 is not equal to the rounded number3.");
    }
  }, number1, number2, number3);
}

async function validate_seats_total_amount() {
  await page.click(".seats .is-clickable");
  await waitForText(page, ".ticket-layout-container [class^='mr'], [class*=' mr']", /Continue/);
  await scrollToElement(page, ".control > :nth-child(2) > :nth-child(3) .el-checkbox__inner");
  await page.click(".control > :nth-child(1) .el-checkbox__inner");
  //TODO Please add an assertion here
await getText(page, ".control > :nth-child(1) [class^='ml'], [class*=' ml']");
  await page.click(".control > :nth-child(2) > :nth-child(2) .el-checkbox__inner");
  //TODO Please add an assertion here
await getText(page, ".control > :nth-child(2) > :nth-child(2) [class^='ml'], [class*=' ml']");
  await page.click(".el-tabs .btn--primary");
  await waitForText(page, ".seat-price > :nth-child(1)", 'Seating');
  //TODO Please add an assertion here
await getText(page, ".seat-price .amount");
  await validate_number1_number2_number3(value1, value2, value3);
}

async function remove_seats_disable_save__continue_enable_save_and_seats_cost_removed() {
  await page.click(".seats .is-clickable");
  await waitForText(page, ".ticket-layout-container [class^='mr'], [class*=' mr']", /Continue/);
  await page.click(".control > :nth-child(1) .el-checkbox__inner");
  await page.click(".control > :nth-child(2) > :nth-child(2) .el-checkbox__inner");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".seats .mr-auto .el-checkbox__inner");
  await page.click(".el-tabs .btn--primary");
  await page.waitFor(1000);
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function Bene__validate_seats__TBD() {
  await validate_seats_total_amount();
  await remove_seats_disable_save__continue_enable_save_and_seats_cost_removed();
}

