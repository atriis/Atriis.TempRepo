/*
 * Test Name: 21020 MERGED benerail travel policy with justification + dynamic fields appear on search even if there are no reference fields
 * Description: oop justification field appears on the cart, drop down options are taken from the administration
 * Status: Active
 * Labels: NL government,OOP,performance,No Amadeus Hotel Book,Regression,Travel policy,Dynamic fields,Bene seats,Benerail Moove Regression,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-11-29T07:52:01Z
 * Updated: 2026-02-03T09:38:42Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Shani@Testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('beny');
  await Search_benerail_by_place('BEABT', 'nlasc');
  await validate_dynamic_fields();
  await add_benerail_2_ways_from_search_results_to_cart();
  await waitForText(page, ".payments-title", 'Trip overview');
  await waitForText(page, ".out-of-policy-badge", 'Out of policy');
  await Accept_and_proceed_to_checkout();
  await waitForText(page, ".form-payment-err", '*In order to proceed, please add all required information');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await validate_justifications();
  await page.click(".el-scrollbar__view > :nth-child(1)");
  await page.click("[class^='px'], [class*=' px'] .btn");
  // Converting a 'wait-for-code-step' step has to be done manually at this time
  await delete_one_and_only_qoute_from_cart_before_checkout();
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

async function Click() {
  if (true) {
    return;
  }
  const boolean_65 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_65) {
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

async function validate_fields() {
  await waitForText(page, ".general-questions > :nth-child(1) .label > :nth-child(1)", 'Type of traveller');
  await waitForText(page, ".general-questions > :nth-child(2) .label > :nth-child(2)", 'Location travel policy');
  await waitForText(page, ".input-textbox .label > :nth-child(1)", 'Personnel number');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, "[title='568023'] span", 'Election observer');
  await waitForText(page, "[title='568028'] span", 'Hardship post');
}

async function validate_noneditable() {
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function validate_can_proceed() {
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".rail-list > :nth-child(1) .ticket-bottom .is-flex > button:nth-of-type(1) .text--bold", 'Fare Rules');
}

async function validate_dynamic_fields() {
  await validate_fields();
  await validate_content();
  await validate_noneditable();
  await validate_can_proceed();
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

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function validate_justifications() {
  await page.click(".oop-justification [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(1) span", 'rail a');
  await waitForText(page, ".el-scrollbar__view > li:nth-of-type(2) span", 'rail b');
  await waitForText(page, "#el-id-9571-1272 > span", 'general a');
  await waitForText(page, "#el-id-9571-1273 > span", 'general b');
}

async function delete_one_and_only_qoute_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

