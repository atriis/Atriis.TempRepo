/*
 * Test Name: 55439 Car - Display day rate
 * Description: 
 * Status: Active
 * Labels: Cars,Gray Dawes,price,Regression,Transportation,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-12-09T05:24:09Z
 * Updated: 2025-09-29T02:40:40Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('carCorp@gdg.com');
  await New_Trip();
  await Add_traveler___I_am_the_traveler();
  await Search_car();
  await Validate_daily_rate_in_results();
  await Add_car_to_cart();
  await Validate_daily_rate_in_cart();
  await Cancel_quote_from_cart_before_checkout();
  await New_search_from_cart();
  await Validate_daily_rate_and_add_to_cart();
  await Validate_number_of_days_and_rate_in_more_details();
  await Trip_Cancelation();
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

async function New_Trip() {
  await book_a_new_trip();
  //TODO Please add an assertion here
await isVisible(page, ".travelers-input");
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  if (false) {
    await page.type("#el-id-9330-775", '07:30');
  }
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
  if (false) {
    await page.type("#el-id-9330-810", '09:00');
  }
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
}

async function Search_car_for_4_days(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9139-272");
  await page.click("[data-popper-placement='top'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[data-popper-placement='top'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9139-275");
  await page.click("[id='el-id-9139-131'] tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-6790-132");
  await page.click("[id='el-id-6790-133'] [class^='mr'], [class*=' mr'] [fill='currentColor']");
  await page.click("#el-id-6790-151 > span");
  await page.click("#el-id-6790-132");
  await waitForText(page, "#el-id-6790-132", '15:00');
  await old();
  await page.click(".search-btn");
}

async function Search_car() {
  await Search_car_for_4_days('FRA');
  await waitForText(page, ".car-list > :nth-child(2) [class^='mt'], [class*=' mt'] p", 'Terms & Conditions');
}

async function Validate_daily_rate_in_results() {
  await waitForText(page, ".car-list > :nth-child(1) .price-title .has-text-centered", '8 days Total');
  await waitForText(page, ".car-list > :nth-child(1) .price-subtitle .has-text-centered", /Per day/);
  //TODO Please add an assertion here
await getText(page, ".car-list > :nth-child(1) .price-subtitle .has-text-centered");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Add_car_to_cart() {
  await add_car_from_results_page_to_cart();
  await waitForText(page, ".product-extra-info > :nth-child(1) > :nth-child(1)", 'To pay');
}

async function Validate_rates() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Validate_daily_rate_in_cart() {
  await waitForText(page, ".has-text-centered", /Per day/);
  //TODO Please add an assertion here
await getText(page, ".has-text-centered");
  await scrollToElement(page, ".more-details .is-flex");
  await page.click(".more-details .is-flex");
  await waitForText(page, "#el-id-5622-397 > div:nth-child(4) > div > div:nth-child(3) > p:nth-child(1)", 'Tax');
  await waitForText(page, "#el-id-5622-397 > div:nth-child(4) > div > div:nth-child(1) > p:nth-child(1)", 'Price Per day');
  //TODO Please add an assertion here
await getText(page, "#el-id-6605-404 > div:nth-child(4) > div > div:nth-child(1) > p:nth-child(2)");
  await waitForText(page, "#el-id-5622-397 > div:nth-child(4) > div > div:nth-child(2) > p:nth-child(1)", 'Subtotal (total for 8 days)');
  //TODO Please add an assertion here
await getText(page, "#el-id-5042-402 > div:nth-child(4) > div > div:nth-child(2) > p:nth-child(2)");
  await Validate_rates();
  await page.click(".parking-details-drawer [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Cancel_quote_from_cart_before_checkout() {
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

async function New_search_from_cart() {
  await page.click(".flicking-camera > :nth-child(3) .btn");
  await page.waitForSelector(".car-form", {state: "visible"});
  await page.click("#el-id-9915-440");
  await page.click("[id*='id'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] span");
  await page.click("#el-id-9915-440");
  await waitForText(page, "#el-id-5825-910", '08:00');
  await page.waitFor(1000);
  await page.click(".btn--size-large");
  await waitForText(page, ".car-list > :nth-child(1) .price-title .has-text-centered", '7 days Total');
}

async function Validate_daily_rate_and_add_to_cart() {
  await waitForText(page, ".car-list > :nth-child(1) .price-subtitle .has-text-centered", /Per day/);
  //TODO Please add an assertion here
await getText(page, ".car-list > :nth-child(1) .price-subtitle .has-text-centered");
  await page.click(".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".product-extra-info > :nth-child(1) > :nth-child(1)", 'To pay');
}

async function Validate_rates_1() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Validate_number_of_days_and_rate_in_more_details() {
  await scrollToElement(page, ".more-details .is-flex");
  await page.click(".more-details .is-flex");
  await waitForText(page, "#el-id-5362-350 > div:nth-child(4) > div > div:nth-child(1) > p:nth-child(1)", 'Price Per day');
  await waitForText(page, "#el-id-5362-350 > div:nth-child(4) > div > div:nth-child(2) > p:nth-child(1)", 'Subtotal (total for 7 days)');
  //TODO Please add an assertion here
await getText(page, "#el-id-1118-708 > div:nth-child(4) > div > div:nth-child(1) > p:nth-child(2)");
  //TODO Please add an assertion here
await getText(page, "#el-id-1118-708 > div:nth-child(4) > div > div:nth-child(2) > p:nth-child(2)");
  await Validate_rates_1();
  await page.click(".parking-details-drawer [xmlns='http://www.w3.org/2000/svg']");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

