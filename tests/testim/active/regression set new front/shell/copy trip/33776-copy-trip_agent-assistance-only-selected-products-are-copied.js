/*
 * Test Name: 33776 Copy Trip - Agent Assistance, Only selected products are copied
 * Description: flight, hotel and car in the cart (added by the agent). one of them was added to the trip by the corporate. the copy trip will copy only the added one
 * Status: Active
 * Labels: Regression,Request Assistance,Cars,Flights,No Amadeus Hotel Book,Hotel,Copy Trip,Transportation,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2025-07-13T08:42:50Z
 * Updated: 2026-02-16T01:56:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('asi@stance.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Request_assistance_button();
  await fill_flight_details();
  await fill_car_details();
  await fill_hotel_details();
  await click_on_send_request();
  await fill_reference_fields();
  await waitForText(page, ".success-message__title", 'Sent to agent');
  await waitForText(page, ".success-message__description", 'Your request was successfully created');
  await page.click(".btn-container > :nth-child(1)");
  //TODO Please add an assertion here
await getText(page, ".trip-title");
  await as_agent___go_to_the_trip_and_add_flight__car_and_hotel();
  await refresh_tab();
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.click("[id='tab-overview'] p");
  await page.waitFor(1000);
  await page.click(".car-quote-card .btn");
  await Success_toast_alert();
  await page.waitFor(2000);
  await click_on_copy_trip();
  await waitForText(page, ".bold-text", /Hire a car at/);
  await waitForText(page, "[aria-label='Copy trip'] .app-label", 'Pending Booking');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[aria-label='Copy trip'] .btn--primary");
  await waitForText(page, ".app-label", 'Pending booking');
  await waitForText(page, ".el-tabs .has-text-weight-semibold", /Hire a car at/);
  await tab_3();
  await waitForText(page, "[class^='my'], [class*=' my'] [class^='mr'], [class*=' mr']", 'Suggested items');
  await waitForText(page, "[title='John F. Kennedy Intl. (JFK),New York, NY, United States'] h5", /car at/);
  await validate_number_of_quotes_in_suggented_items_in_the_new_trip__tab_3_();
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

async function Request_assistance_button() {
  await page.click(".page-view .icon-container");
}

async function fill_flight_details() {
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", 'lhr');
  await page.click(".autocomplete-result");
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", 'MAD');
  await page.click(".ellipsis");
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-icon-arrow-right");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(5) span");
  await page.click(".end-date span");
}

async function choose_hour() {
  if (true) {
    return;
  }
  await page.click("[placeholder='Pick-up Time']");
  await page.click(".is-multiline > :nth-child(2) [placeholder='HH']");
  await page.click("[x-placement='bottom-start'] .selected");
  await page.click(".is-multiline > :nth-child(2) [placeholder='mm']");
  await page.click("[x-placement='bottom-start'] .selected");
  await page.click(".is-multiline > :nth-child(2) .btn-apply");
}

async function choose_hour_1() {
  if (true) {
    return;
  }
  await page.click("[placeholder='Drop-off Time']");
  await page.click(".is-multiline > :nth-child(4) [placeholder='HH']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(11) span");
  await page.click(".is-multiline > :nth-child(4) [placeholder='mm']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click(".is-multiline > :nth-child(4) .btn-apply");
}

async function fill_car_details() {
  await scrollToElement(page, ".btns-list > :nth-child(3) .icon-text");
  await page.click(".btns-list > :nth-child(3) .icon-text");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", 'JFK');
  await page.click("[id^='el-popper-container'] .has-text-weight-bold");
  await page.click("[placeholder='Pick-up Date']");
  await page.click("[aria-label='Next Month']");
  await page.click("[aria-hidden='false'] tbody > :nth-child(4) > :nth-child(6)");
  await page.click("[placeholder='Drop-off Date']");
  await page.click("[aria-hidden='false'] tbody > :nth-child(5) > :nth-child(2)");
  if (false) {
    await page.click("#el-id-9521-943");
  }
  if (false) {
    await page.click("[aria-hidden='false'] .btn-apply");
  }
  if (false) {
    await page.click("#el-id-9521-978");
  }
  if (false) {
    await page.click("[aria-hidden='false'] .btn-apply");
  }
  await choose_hour();
  await choose_hour_1();
}

async function fill_hotel_details() {
  await scrollToElement(page, ".btns-list > :nth-child(2) .icon-text");
  await page.click(".btns-list > :nth-child(2) .icon-text");
  await page.type("#el-id-3969-1180", 'lon');
  await page.click("[id='el-id-3969-1158-item-0'] .ellipsis");
  await page.click("[placeholder='Check in']");
  await page.click("[aria-hidden='false'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-hidden='false'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("[aria-hidden='false'] .end-date .el-date-table-cell__text");
  await scrollTo(page, 0, 1144);
}

async function click_on_send_request() {
  await page.click(".btn--primary");
}

async function fill_reference_fields() {
  if (true) {
    return;
  }
  await page.click("[id='el-collapse-content-1191'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3969-1194 > span");
  await page.click("[id='el-collapse-content-1197'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3969-1208 > span");
  await page.click("body > :nth-child(21) .btn--primary");
}

async function log_out_if_needed() {
  if (await isVisible(page, ".loginButtonSubmit")) {
    return;
  }
  await waitForText(page, "[ng-show='tripsViewMode==3'] > :nth-child(2)", 'Welcome on Board!');
  await page.click(".SignOut");
  await page.waitFor(3000);
}

async function log_in_to_gtp_with_the_agent() {
  await page.goto('https://2.gtp-staging.com/');
  await page.waitFor(3000);
  await log_out_if_needed();
  await page.type("#username", 'amy@deus.com');
  await page.type("#Password", 'MAGA!$$2k26');
  await page.click(".loginButtonSubmit");
  await waitForText(page, "[ng-show='mybookingsViewMode==MybookingsViewMode.Landing'] > :nth-child(2)", 'Welcome on Board!');
}

async function as_agent___go_to_the_trip() {
  await page.goto('https://2.gtp-staging.com/Trip/' +tripNumber);
}

async function as_agent___add_2_flights() {
  await waitForText(page, "[ng-click='onFlightReSearchClicked($index,\'research\')'] .ng-binding", 'Search Online');
  await page.waitFor(2000);
  await page.click("[ng-click='onFlightReSearchClicked($index,\'research\')'] .ng-binding");
  await waitForText(page, "[ng-disabled='showLoadingSearch || IsDisableFlightSearch']", 'Search');
  await page.waitFor(2000);
  await page.type("#from0", 'DOH');
  await page.waitFor(300);
  await page.click("#ui-id-8");
  await page.waitFor(500);
  await page.click("[ng-disabled='showLoadingSearch || IsDisableFlightSearch']");
  await waitForText(page, "[id='priceTd'] .ng-binding", 'Price');
  await page.waitFor(300);
  await page.click("[id='button-flight0'] .trip-cart-icon-new");
  await waitForText(page, "[ng-class='{altertnativePackage:packageModel.IsAlternativePackageWasSelected}']", '1 Added');
  await page.click("#ss");
}

async function as_agent___add_2_cars() {
  await waitForText(page, "[ng-click='onCarReSearchClicked($index,\'research\')'] .ng-binding", 'Search Online');
  await page.click("[ng-click='onCarReSearchClicked($index,\'research\')'] .ng-binding");
  await waitForText(page, "[data-ng-click='onSearchCarsClicked()']", 'Search');
  await page.click("[data-ng-click='onSearchCarsClicked()']");
  await waitForText(page, "[data-ng-click='onSortHeaderClicked(rentalAgencySort)']", 'Rental Agency');
  await page.click("[id='carItem0'] .trip-cart-icon-new");
  await waitForText(page, "[ng-hide='bookingInProgress || bookingSucceeded || bookingFailed'] .ng-binding", 'Added');
  await page.click("#ss");
}

async function as_agent___add_hotel() {
  await waitForText(page, "[ng-click='onHotelReSearchClicked($index,\'research\')'] .ng-binding", 'Search Online');
  await page.click("[ng-click='onHotelReSearchClicked($index,\'research\')'] .ng-binding");
  await waitForText(page, "[ng-hide='isCorporateUser'] .block-display", 'Include Special Rate:');
  await page.click("[data-ng-click='onSearchHotelsClicked()']");
  await waitForText(page, ".filter-sort-by", 'Sort by:');
  await page.click("[id='hotelItem0'] [ng-switch='isPriceOffer'] .ng-binding");
  await page.click(".room-container > :nth-child(3) > div:nth-of-type(1) .trip-cart-icon-new");
  await waitForText(page, "[ng-hide='bookingInProgress || bookingSucceeded || bookingFailed'] .ng-binding", '1 Added');
  await page.click("#ss");
  await waitForText(page, "[quote-id='3412255'] [on='isBookingInProgress'] .ng-binding", 'Pending Booking');
  await waitForText(page, "#as > span", '6');
}

async function as_agent___go_to_the_trip_and_add_flight__car_and_hotel() {
  await log_in_to_gtp_with_the_agent();
  await as_agent___go_to_the_trip();
  await as_agent___add_2_flights();
  await as_agent___add_2_cars();
  await as_agent___add_hotel();
  await page.waitFor(4000);
}

async function refresh_tab() {
  await page.reload();
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function click_on_copy_trip() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#el-id-1344-210 > li:nth-child(2)");
}

async function tab_3() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_number_of_quotes_in_suggented_items_in_the_new_trip__tab_3_() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

