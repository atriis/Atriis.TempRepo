/*
 * Test Name: 33779 Copy Trip - Products eligible for copy - flight hotel and car
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-10-10T10:02:58Z
 * Updated: 2023-11-29T06:27:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Pit@Rip.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await add_flight_hotel_and_car_to_the_cart();
  await _33779();
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

async function add_flight_hotel_and_car_to_the_cart() {
  await Search_flights_round_trip('par', 'lon');
  await page.click("body > :nth-child(15) .btn--primary");
  await Add_flight_from_results_page_to_cart();
  await waitForText(page, ".text--bold", 'Pending Booking');
  await page.click(".flicking-camera > :nth-child(2) .icon-text");
  await waitForText(page, "[placeholder='Select']", '1 Room');
  await page.click(".btn--size-large");
  await add_hotel_from_search_results_to_cart();
  await waitForText(page, ".box-card-container [class^='ml'], [class*=' ml']", 'Pending Booking');
  await page.click(".flicking-camera > :nth-child(3) .icon-text");
  await waitForText(page, ".el-drawer__open .el-checkbox__label", 'Drop-off at a different location');
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", 'lhr');
  await page.click("[role='region'] .has-text-weight-bold");
  await page.click(".btn--size-large");
  await add_car_from_results_page_to_cart();
  await waitForText(page, "[id='pane-overview'] > :nth-child(1) > :nth-child(1) [class^='ml'], [class*=' ml']", 'Pending Booking');
}

async function copy_trip() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#dropdown-menu-4932 > li:nth-child(2)");
  await waitForText(page, ".regular-text p", 'The following items will be copied to a new trip');
  await waitForText(page, ".quote-details-container > :nth-child(1) .app-label", 'Pending Booking');
  await waitForText(page, ".quote-details-container > :nth-child(2) .app-label", 'Pending Booking');
  await waitForText(page, ".quote-details-container > :nth-child(3) .app-label", 'Pending Booking');
  await page.click("[aria-label='Copy trip'] .btn--primary");
}

async function validate_number_of_quotes_tab_3() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validations() {
  await page.click(".trip-cart");
  //TODO Please add an assertion here
await getText(page, "[id='pane-overview'] > :nth-child(1) > :nth-child(1) .ticket-details h4");
  await waitForText(page, "[id='pane-overview'] > :nth-child(1) > :nth-child(1) .ticket-details h4", hotelName);
  //TODO Please add an assertion here
await getText(page, ".not-last-segment .carrier-container div > :nth-child(2)");
  await waitForText(page, ".not-last-segment .carrier-container div > :nth-child(2)", flightNumber);
  //TODO Please add an assertion here
await getText(page, ".center-title");
  await waitForText(page, ".center-title", carType);
  await validate_number_of_quotes_tab_3();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

async function _33779() {
  await copy_trip();
  await validations();
  await Trip_Cancelation();
  await Trip_Cancelation();
}

