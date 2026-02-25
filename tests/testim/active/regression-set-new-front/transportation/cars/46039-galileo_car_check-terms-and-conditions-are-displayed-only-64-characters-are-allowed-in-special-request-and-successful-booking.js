/*
 * Test Name: 46039 Galileo - Car - Check "Terms and Conditions" are displayed, only 64 characters are allowed in special request and successful booking
 * Description: 
 * Status: Active
 * Labels: Galileo,Cars,Regression,special request,Full Purchase,Terms and Conditions,progress page,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-05-10T11:01:07Z
 * Updated: 2025-07-16T12:49:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('beatrizpamplonacorp@galileo.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await search_car_by_place_and_AVIS_rental_agency('LHR');
  await Car___Results___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_();
  await add_car_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Only_64_characters_are_allowed_in_special_request();
  await Car___Cart___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await Cart___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_();
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

async function search_car_by_place_and_AVIS_rental_agency(place) {
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
  await page.click("#el-id-528-291");
  await page.type("#el-id-528-291", 'ZI');
  await page.click("#el-id-528-211 > span");
  await page.click(".btn");
  await old2();
}

async function Car___Results___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_() {
  await waitForText(page, ".car-list > :nth-child(1) [class^='mt'], [class*=' mt'] p", 'Terms & Conditions');
  await page.click(".car-list > :nth-child(1) [class^='mt'], [class*=' mt'] p");
  await waitForText(page, "#el-id-3897-282", /RATE/);
  await page.click("body > :nth-child(22) [xmlns='http://www.w3.org/2000/svg']");
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Only_64_characters_are_allowed_in_special_request() {
  await scrollToElement(page, ".car-special-request .is-clickable");
  await page.click(".car-special-request .is-clickable");
  await waitForText(page, ".el-input__count", '0 / 64');
  await page.click("[autocomplete='off']");
  await page.type("[autocomplete='off']", 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  await waitForText(page, ".el-input__count", '64 / 64');
}

async function Car___Cart___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_() {
  await page.click("[class^='pt'], [class*=' pt'] a");
  await waitForText(page, "#el-id-3897-391", /RATE/);
  await page.click("body > :nth-child(26) [xmlns='http://www.w3.org/2000/svg']");
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

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Cart___Click__Terms_and_Conditions__and_check_if_it_is_displayed__AVIS_() {
  await page.click("[class^='pt'], [class*=' pt'] a");
  await waitForText(page, "#el-id-3897-391", /RATE/);
  await page.click("body > :nth-child(26) [xmlns='http://www.w3.org/2000/svg']");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

