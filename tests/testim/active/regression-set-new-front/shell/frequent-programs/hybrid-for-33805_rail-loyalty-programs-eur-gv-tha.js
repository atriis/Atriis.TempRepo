/*
 * Test Name: HYBRID for 33805 - rail loyalty programs EUR GV THA
 * Description: htbrid test - book  benerail with loyalty numbers: EUR (4578213), GV (1254786) and THA (8204636).
manually - check that the vendor codes and loyalty numbers appear in the log (hold)
 * Status: Active
 * Labels: Rail,Rail loyalty numbers,hybrid,never failed,Bene seats,Benerail Moove Regression,Transportation,2026 plan 2
 * Owner: Shani Hadar
 * Created: 2024-02-25T07:09:47Z
 * Updated: 2025-10-28T09:36:32Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('tali@loyal.com');
  await trip_1___EUR();
  await trip_1___4578213__EUR();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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
  const boolean_37 = await page.evaluate(() => {
    if ((year2WeeksLater + " " + month2WeeksLater) !== currentDate) {
        return true
    }
  }).catch(() => false);
  if (boolean_37) {
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

async function old() {
  if (true) {
    return;
  }
  await waitForText(page, ".booking-error-dialog .el-dialog__title", 'Checkout notification');
  await page.click(".back-to-trip-btn");
}

async function choose_loyalty_number_for_EUR__4578213__and_book() {
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(1) .btn", 'Fare Rules');
  await scrollTo(page, 0, 476);
  await waitForText(page, ".loyalty-program .card-title", 'Loyalty number');
  await page.click(".loyalty-program .is-clickable");
  await page.click("[id='tab-1']");
  await page.waitFor(2000);
  await page.click("[id='pane-1'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1783-408 > span");
  await page.waitFor(1000);
  await page.click("[id='pane-overview'] .no-border");
  await waitForText(page, ".loyalty-program .material-symbols-outlined", 'check_circle');
  await Accept_and_proceed_to_checkout();
  await waitForText(page, "[id='el-collapse-content-5043'] [class^='ml'], [class*=' ml']", 'Tali  Loyal');
  await page.click(".is-hidden-mobile");
  await old();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Refresh_tab() {
  await page.reload();
}

async function Trip_Cancelation___warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function trip_1___EUR() {
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place('BEABT', 'BEBMI');
  await click_on_proceed_after_search();
  await add_benerail_2_ways_from_search_results_to_cart();
  await choose_loyalty_number_for_EUR__4578213__and_book();
  await Click_Go_to_Trip();
  await waitForText(page, ".has-text-weight-semibold", /EU Rail To/);
  await page.waitFor(30000);
  await Refresh_tab();
  await waitForText(page, ".has-text-weight-semibold", /EU Rail To/);
  await Trip_Cancelation___warning_and_continue();
  await close_tab___choose_relevant_tab_in_context();
}

async function choose_loyalty_number_for_EUR__4578213__and_book_1() {
  await waitForText(page, ".ticket-details > :nth-child(1) > :nth-child(1) .btn", 'Fare Rules');
  await scrollTo(page, 0, 476);
  await waitForText(page, ".loyalty-program .card-title", 'Loyalty number');
  await page.click(".loyalty-program .is-clickable");
  await page.click("#tab-1");
  await page.click("[id='pane-1'] .el-select__caret");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("[id='pane-overview'] .no-border");
  await waitForText(page, ".loyalty-program .material-symbols-outlined", 'check_circle');
  await Accept_and_proceed_to_checkout();
  await waitForText(page, "[id='el-collapse-content-5043'] [class^='ml'], [class*=' ml']", 'Tali  Loyal');
  await page.click(".is-hidden-mobile");
}

async function trip_1___4578213__EUR() {
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place('BEABT', 'BEBMI');
  await click_on_proceed_after_search();
  await add_benerail_2_ways_from_search_results_to_cart();
  await choose_loyalty_number_for_EUR__4578213__and_book_1();
  await Click_Go_to_Trip();
  await waitForText(page, ".has-text-weight-semibold", /EU Rail To/);
  await page.waitFor(30000);
  await Refresh_tab();
  await waitForText(page, ".has-text-weight-semibold", /EU Rail To/);
  await Trip_Cancelation___warning_and_continue();
}

