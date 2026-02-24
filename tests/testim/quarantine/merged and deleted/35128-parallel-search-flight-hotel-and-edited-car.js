/*
 * Test Name: 35128 Parallel search flight, hotel and edited Car
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-10-09T08:18:05Z
 * Updated: 2023-12-10T08:40:48Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_and_edit_car('LON', 'TLV');
  await NL___fill_ref_field_education_and_courses();
  await waitForText(page, ".origin-info > :nth-child(1)", 'London (LON)');
  await waitForText(page, ".origin-info > :nth-child(3)", 'Tel Aviv       (TLV)');
  await page.click(".edit-search-btn");
  await waitForText(page, "[placeholder='Depart Date']", flight_date_from_entered);
  await waitForText(page, "[placeholder='Return Date']", flight_date_to_entered);
  await page.click(".close-btn");
  await Copy_of_Add_flight_from_results_page_to_cart();
  await waitForText(page, "b", 'Tel Aviv hotel');
  await add_hotel();
  await waitForText(page, "b", 'Madrid car hire');
  await waitForText(page, ".locations .ellipsis-txt", 'Madrid,Spain,(MAD)');
  await page.click(".edit-search-btn");
  await waitForText(page, "[placeholder='Pick-up Date']", car_date_from_entered);
  await waitForText(page, "[placeholder='Drop-off Date']", car_date_to_entered);
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
}

async function old() {
  if (true) {
    return;
  }
  await page.click("[id='pane-flight'] .is-justify-content-space-between > :nth-child(2) .control > :nth-child(2) .el-checkbox__inner");
  await waitForText(page, ".page-view .has-text-weight-bold", 'Tel Aviv');
  await waitForText(page, ".btn--size-none span", 'Edit search');
  await page.click(".btn--size-none span");
  await page.waitFor(1000);
  if (false) {
    await page.click("[aria-activedescendant='el-autocomplete-2999-item--1']");
  }
  await page.type("[aria-activedescendant='el-autocomplete-2999-item--1']", 'MAD');
  await page.waitFor(3000);
  await page.click("#el-autocomplete-2303-item-0");
}

async function Search_flight_and_edit_car(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await page.click(".ellipsis");
  await old_date_picker();
  await page.click("[placeholder='Depart Date']");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(2) span");
  await page.click(".end-date span");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Depart Date']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Return Date']");
  await old();
  await page.click("[class^='mr'], [class*=' mr'] .el-checkbox__inner");
  await waitForText(page, "[id='pane-flight'] .is-justify-content-space-between > :nth-child(2) .control > :nth-child(1) p", 'Add Hotel in                  Tel Aviv');
  await waitForText(page, "[class^='mr'], [class*=' mr'] span", 'Edit search');
  await page.click("[id='pane-flight'] .is-justify-content-space-between > :nth-child(2) .control > :nth-child(2) .el-checkbox__inner");
  await page.click("[id='pane-flight'] .is-justify-content-space-between > :nth-child(2) .control > :nth-child(2) .btn span");
  await page.click("[aria-activedescendant='el-autocomplete-2467-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2467-item--1']", '');
  await page.waitFor(3000);
  await page.click("[aria-activedescendant='el-autocomplete-2467-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2467-item--1']", 'MAD');
  await page.waitFor(3000);
  await page.click("[id='el-autocomplete-2467-item-0'] .ellipsis");
  await page.waitFor(1000);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[id='pane-flight'] [placeholder='Pick-up Date']");
  await page.type("[id='pane-flight'] [placeholder='Pick-up Date']", FromCar);
  await sendSpecialCharacter(page, "[id='pane-flight'] [placeholder='Pick-up Date']", 'Enter');
  await page.click("[id='pane-flight'] [placeholder='Pick-up Time']");
  await page.type("[id='pane-flight'] [placeholder='Pick-up Time']", '10:30');
  await sendSpecialCharacter(page, "[id='pane-flight'] [placeholder='Pick-up Time']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[id='pane-flight'] [placeholder='Drop-off Date']");
  await page.type("[id='pane-flight'] [placeholder='Drop-off Date']", toCar);
  await sendSpecialCharacter(page, "[id='pane-flight'] [placeholder='Drop-off Date']", 'Enter');
  await page.click("[id='pane-flight'] [placeholder='Drop-off Time']");
  await page.type("[id='pane-flight'] [placeholder='Drop-off Time']", '10:30');
  await sendSpecialCharacter(page, "[id='pane-flight'] [placeholder='Drop-off Time']", 'Enter');
  //TODO Please add an assertion here
await getText(page, "[id='pane-flight'] [placeholder='Pick-up Date']");
  //TODO Please add an assertion here
await getText(page, "[id='pane-flight'] [placeholder='Drop-off Date']");
  await page.click(".trip-search-control");
  await page.click(".search-btn");
}

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
}

async function Copy_of_Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .is-hidden-mobile");
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "'      Proceed    '") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_refundable_hotel() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    let refundableRoom=document.querySelector(".refundable.cancellation-terms");
    refundableRoom.parentElement.parentElement.parentElement.parentElement.children[1].firstChild.firstChild.firstChild.children[2].click()
  });
}

async function Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "'      Proceed    '") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_hotel() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".app-filter__content > :nth-child(2) h4", 'Payment');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

