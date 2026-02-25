/*
 * Test Name: 22079 MERGED Parallel search flight, hotel and edited Car + travel policy determined by the primary passenger (booker)
 * Description: 
 * Status: Active
 * Labels: Parallel,Flights,Hotel,No Amadeus Hotel Book,Cars,Regression,NL government,Travel policy,Search Flight,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-12-21T12:29:22Z
 * Updated: 2026-01-18T08:19:22Z
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
  await Search_flight_and_hotel_and_edit_car();
  await NL___fill_ref_field_education_and_courses();
  await waitForText(page, ".origin-info > :nth-child(1)", 'London (LON)');
  await waitForText(page, ".origin-info > :nth-child(3)", 'Amsterdam  (AMS)');
  await page.click(".edit-search-btn");
  await waitForText(page, "[placeholder='Depart Date']", flight_date_from_entered);
  await waitForText(page, "[placeholder='Return Date']", flight_date_to_entered);
  await page.click(".close-btn");
  await Copy_of_Add_flight_from_results_page_to_cart();
  if (!(await isVisible(page, "body > :nth-child(17) [role='heading']"))) {
    await waitForText(page, "b", 'Amsterdam hotel');
  }
  await validate_text__Tel_Aviv_hotel__in_case_there_is_a_conflicting_quotes_pop_app();
  await validate_policy();
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

async function Search_flight_and_hotel_and_edit_car() {
  await page.click("[id='tab-flight'] p");
  await page.type("[placeholder='From... Departure']", 'LON');
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  await page.type("[placeholder='To... Destination']", 'AMS');
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Depart Date']");
  //TODO Please add an assertion here
await getText(page, "[placeholder='Return Date']");
  await page.click("[class^='mr'], [class*=' mr'] .el-checkbox__inner");
  await waitForText(page, ".parallel-hotel-search-destinations", 'Add Hotel in Amsterdam');
  await waitForText(page, "[class^='mr'], [class*=' mr'] span", 'Edit');
  await page.click("[class^='my'], [class*=' my'] .control > :nth-child(2) .el-checkbox__inner");
  await page.click("[class^='my'], [class*=' my'] .control > :nth-child(2) .btn span");
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[aria-activedescendant='el-autocomplete-2467-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2467-item--1']", '');
  await page.waitFor(3000);
  await page.click("[aria-activedescendant='el-autocomplete-2467-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2467-item--1']", 'MAD');
  await page.click("[id='el-id-761-917-item-0'] .has-text-weight-bold");
  if (false) {
    await page.click("[id='pane-flight'] [placeholder='Pick-up Time']");
  }
  if (false) {
    await page.click("[id='el-id-6418-921'] .btn-apply");
  }
  if (false) {
    await page.click("[id='pane-flight'] [placeholder='Drop-off Time']");
  }
  if (false) {
    await page.click("[id='el-id-6418-956'] .btn-apply");
  }
  await page.click(".trip-search-control");
  await page.type("#el-id-6015-990", FromCar);
  await sendSpecialCharacter(page, "#el-id-6015-990", 'Enter');
  await page.click("[id='pane-flight'] [placeholder='Drop-off Date']");
  await page.type("[id='pane-flight'] [placeholder='Drop-off Date']", toCar);
  await sendSpecialCharacter(page, "[id='pane-flight'] [placeholder='Drop-off Date']", 'Enter');
  await page.click(".trip-search-control");
  //TODO Please add an assertion here
await getText(page, "[id='pane-flight'] [placeholder='Pick-up Date']");
  //TODO Please add an assertion here
await getText(page, "[id='pane-flight'] [placeholder='Drop-off Date']");
  await page.click(".search-btn");
  if (false) {
    await sendSpecialCharacter(page, "#el-id-4100-989", 'Tab');
  }
  if (false) {
    await page.click("#el-id-6015-990");
  }
}

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
}

async function Copy_of_Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .is-hidden-mobile");
}

async function validate_text__Tel_Aviv_hotel__in_case_there_is_a_conflicting_quotes_pop_app() {
  if (!(await isVisible(page, "body > :nth-child(17) [role='heading']"))) {
    return;
  }
  await page.click("[class^='mr'], [class*=' mr']");
  await waitForText(page, "b", 'Amsterdam hotel');
}

async function validate_policy() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".app-filter__content > :nth-child(2) h4", 'Payment');
  await page.hover("[aria-describedby='el-tooltip-1396']");
  await waitForText(page, "#el-tooltip-9044 > ul > li", /Hotel cost per night is greater than or equals 70 EUR/);
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
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

