/*
 * Test Name: 29785 information added in the ui doesn't saved in the administration
 * Description: if the user has the role: Prevent updating others and own profile, then data entered in the trip does not updated in the administration
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-10-05T12:03:56Z
 * Updated: 2023-10-05T12:50:39Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('amos@one.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('LON', 'NYC');
  await page.click("body > :nth-child(15) .btn--primary");
  await Add_flight_from_results_page_to_cart();
  await search_hotel_from_cart();
  await add_hotel_from_search_results_to_cart();
  await search_car_from_cart();
  await add_car_from_results_page_to_cart();
  await add_hotel_loyalty_number();
  await add_passport();
  await add_flight_frequent_flyer();
  await add_car_loyalty_number();
  await page.click("[aria-describedby='el-tooltip-2633'] .material-symbols-outlined");
  await waitForText(page, "[name='Name']", 'TESTIM nl corp');
  await page.click("[title='Users']");
  await waitForText(page, ".admin-search-bar > :nth-child(3)", 'Active');
  await page.click("[ng-disabled='isDisabled']");
  await page.type("[ng-disabled='isDisabled']", 'Amos one');
  await page.click("[data-ng-repeat='user in users | filter: showUser | orderBy:mainTableSort | limitTo:limitToUsers'] > :nth-child(3)");
  await waitForText(page, "[ng-class='{\'active\':activeTab == CorporateUserTabs.passport}']", 'Passports and Visas');
  await page.click("[ng-class='{\'active\':activeTab == CorporateUserTabs.passport}']");
  await waitForText(page, "[ng-show='!isLoading'] > div:nth-of-type(1) .admin-field-group-header", 'Add Passport');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await list_validation();
  await page.click("[ng-class='{\'active\':activeTab == CorporateUserTabs.frequent}']");
  if (await getText(page, "[aria-describedby='ui-id-4'] .ui-dialog-buttonset > :nth-child(2)") === "'Proceed without saving'") {
    await page.click("[aria-describedby='ui-id-4'] .ui-dialog-buttonset > :nth-child(2)");
  }
  await waitForText(page, "[user='selectedUser'] > :nth-child(1) .admin-field-group-header", 'Frequent flyer / Membership number');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await scrollTo(page, 0, 297);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await list_validation_1();
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
  await page.click(".trip-search-control");
}

async function Search_flights_round_trip(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  if (false) {
    await page.click(".ellipsis");
  }
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await old_date_picker();
  await page.click(".search-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function search_hotel_from_cart() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.click(".flicking-camera > :nth-child(2) .icon-text");
  await waitForText(page, "[placeholder='Select']", '1 Room');
  await page.click(".btn--size-large");
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

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
  await Pending_Booking___Wait_for_element_text();
  await waitForText(page, ".ticket-top-section p", 'Refundable');
}

async function search_car_from_cart() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.click(".flicking-camera > :nth-child(3) .icon-text");
  await waitForText(page, ".el-drawer__open .el-checkbox__label", 'Drop-off at a different location');
  await page.click(".btn--size-large");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function add_hotel_loyalty_number() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.click(".quote-extras--loyalty-number .is-clickable");
  await page.click("[type='text']");
  await page.click(".el-scrollbar__view > :nth-child(1)");
  await page.click("[type='number']");
  await page.type("[type='number']", '123456');
  await page.click(".tabs-container .no-border");
}

async function add_passport() {
  await page.click(".flight-passenger-info .is-clickable");
  await page.click("[id='pane-1611740'] > :nth-child(2) > :nth-child(1) [type='text']");
  await page.type("[id='pane-1611740'] > :nth-child(2) > :nth-child(1) [type='text']", '456789');
  await page.click("[id='pane-1611740'] > :nth-child(2) [placeholder='Select']");
  await page.type(".is-focus [type='text']", 'netherlands');
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(157) span");
  await page.click("[id='pane-1611740'] > :nth-child(2) [placeholder='dd/mm/yyyy']");
  await page.type("[id='pane-1611740'] > :nth-child(2) [placeholder='dd/mm/yyyy']", '03/05/2030');
  await sendSpecialCharacter(page, "[id='pane-1611740'] > :nth-child(2) [placeholder='dd/mm/yyyy']", 'Enter');
  await page.click(".tabs-container .no-border");
}

async function add_flight_frequent_flyer() {
  await page.click(".flight-frequent-flyer .is-clickable");
  await page.click("[placeholder='Frequent Flyer']");
  await page.type("[placeholder='Frequent Flyer']", '789654');
  await page.click("[placeholder='Select']");
  await page.type("[placeholder='Select']", 'el al');
  await page.click(".el-scrollbar__view > li:nth-of-type(200) span");
  await page.click(".tabs-container .no-border");
}

async function add_car_loyalty_number() {
  await page.click(".car-driver-loyalty .is-clickable");
  await page.click("[type='text']");
  await page.type("[type='text']", '854712');
  await page.click(".tabs-container .no-border");
  await waitForText(page, ".el-notification__title", 'Success');
}

async function list_validation() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function list_validation_1() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

