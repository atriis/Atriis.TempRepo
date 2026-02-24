/*
 * Test Name: 38312 MERGED transferz - booking + see "all types" +vehicle filter+ add ons
 * Description: 
 * Status: Active
 * Labels: Filters,No Amadeus Hotel Book,Full Purchase,Transferz Regression,progress page,Pre Prod,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-11-29T09:31:37Z
 * Updated: 2025-09-29T02:44:58Z
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
  await Groundscope_search('Brussels, Belgium - National (BRU)', 'Rue de la Violette, Brussels, Belgium');
  await page.click("body > :nth-child(18) .btn--primary");
  await waitForText(page, ".show-count p", /Showing/);
  if (await isVisible(page, ".view-more-btn")) {
    await page.click(".view-more-btn");
  }
  await waitForText(page, ".app-filter__content > :nth-child(4) h4", /Vehicle/);
  await page.waitFor(1000);
  await filter_by_vehicle_type___Business_limousine();
  await validate_results_by_the_filter();
  await filter_by_vehicle_type___minivan();
  await remove_filter_by_vehicle_type___Business_limousine();
  await validate_results_by_the_filter_1();
  await add_transferz_from_results_page_to_cart();
  await waitForText(page, ".more-details", 'More details');
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await add_contact_information();
  await add_extra();
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await validate_number1_number2_number3(priceBefore, extra, priceAfter);
  await Accept_and_proceed_to_checkout();
  await Book_and_finalize();
  await waitForText(page, "[class^='ml'], [class*=' ml']", /(In progress)|(Ticketed)|(Confirmed)/);
  await page.click("[class^='px'], [class*=' px']");
  await waitForText(page, ".el-dialog__body span", /To access the full terms and conditions, please check/);
  await page.click("body > :nth-child(25) [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
  await Trip_Cancelation___warning_and_continue();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
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

async function Groundscope_search(pickUp, dropOff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", pickUp);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", dropOff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("[placeholder='Pick-up time']");
  await page.type("#el-id-1402-690", 'all vehicle types');
  await page.click("[id*='id'] span");
  await page.waitFor(1000);
  await page.click(".details-container > :nth-child(2) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6660-916 > span");
  await page.click(".ground-transport-search-content");
  await page.click(".ground-transport-search-content");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper ']");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.click(".search-btn");
}

async function filter_by_vehicle_type___Business_limousine() {
  if (await getText(page, "[title='Business limousine']") === "/Minibus/") {
    await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
  }
}

async function validate_results_by_the_filter() {
  await waitForText(page, ".ground-transport-desc", /Minibus/);
}

async function filter_by_vehicle_type___minivan() {
  if (await getText(page, "[title='Business limousine']") === "/Minivan/") {
    await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
  }
}

async function remove_filter_by_vehicle_type___Business_limousine() {
  if (await getText(page, "[title='Business limousine']") === "/Minibus/") {
    await page.click(".app-filter__content > :nth-child(4) [role='group'] > :nth-child(1) .el-checkbox__inner");
  }
}

async function validate_results_by_the_filter_1() {
  await waitForText(page, ".ground-transport-desc", /Minivan/);
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_transferz_from_results_page_to_cart() {
  await waitForText(page, ".desktop-btn", 'Add to trip');
  await page.click(".desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function add_contact_information() {
  await scrollTo(page, 0, 269);
  await waitForText(page, ".contact-information .card-title", '* Contact Information');
  await page.click(".contact-information .is-clickable");
  await page.click("[maxlength='3']");
  await page.type("[maxlength='3']", '972');
  await page.click(".control > div:nth-of-type(2) [type='number']");
  await page.type(".control > div:nth-of-type(2) [type='number']", '52');
  await page.click(".control > div:nth-of-type(3) [type='number']");
  await page.type(".control > div:nth-of-type(3) [type='number']", '6354125');
  await page.click(".tabs-container .no-border");
  await waitForText(page, ".el-notification__title", 'Success');
}

async function loop() {
  if (await getText(page, ".tabs-container [class^='mb'], [class*=' mb'] > :nth-child(1) .type-price-container span") === "'Free'") {
    //TODO Please add an assertion here
await isElementChecked(page, ".tabs-container [class^='mb'], [class*=' mb'] > :nth-child(1) .el-checkbox__input");
  }
}

async function add_extra() {
  await scrollTo(page, 0, 269);
  await waitForText(page, ".add-ons-transferz .card-title", 'Available extras');
  await waitForText(page, ".success-icon", 'check_circle');
  await page.click(".add-ons-transferz .is-clickable");
  await waitForText(page, ".total-price div", 'Total: €0.00');
  await loop();
  await page.click(".tabs-container [class^='mb'], [class*=' mb'] > :nth-child(1) .el-checkbox__inner");
  //TODO Please add an assertion here
await getText(page, ".tabs-container [class^='mb'], [class*=' mb'] > :nth-child(1) .type-price-container span");
  await page.click(".tabs-container .no-border");
  await waitForText(page, ".el-notification__title", 'Success');
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

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Trip_Cancelation___warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

