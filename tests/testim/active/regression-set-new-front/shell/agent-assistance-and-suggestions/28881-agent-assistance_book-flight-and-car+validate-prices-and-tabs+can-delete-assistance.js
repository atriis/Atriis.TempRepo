/*
 * Test Name: 28881 agent assistance - book flight and car + validate prices and tabs + can delete assistance
 * Description: 
 * Status: Active
 * Labels: Regression,Request Assistance,Cars,Flights,Full Purchase,No Amadeus Hotel Book,Transportation,Cancel by process,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-26T10:40:23Z
 * Updated: 2026-02-16T01:34:05Z
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
  await click_on_send_request();
  await fill_reference_fields();
  await waitForText(page, ".success-message__title", 'Sent to agent');
  await waitForText(page, ".success-message__description", 'Your request was successfully created');
  await page.waitFor(15000);
  await validate_email();
  await log_in_to_the_agent___shugi_bugi();
  await click_on_a_link_in_the_last_mail(1);
  await add_2_flights();
  await add_2_cars();
  await page.click(".btn-container > :nth-child(1)");
  await validate_overview_tab();
  await validate_requests_tab();
  await add_first_car_and_last_flight_to_the_cart();
  await waitForText(page, ".flight-quote-summary .summary-title", 'Flight To Tel Aviv');
  await validate_prices();
  await validate_number_of_quotes_2();
  await validate_2_added();
  await validate_2_added_in_suggested_items();
  await proceed_to_checkout_and_submit_for_approvals();
  await Click_Go_to_Trip();
  await waitForText(page, ".tabs-container .car-quote-card .has-text-weight-semibold", 'Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States');
  await waitForText(page, "[aria-describedby='el-tooltip-2801']", 'Confirmed');
  await waitForText(page, ".tabs-container .flight-quote-card .has-text-weight-semibold", 'Flight to Tel Aviv');
  await waitForText(page, ".on-hold", /(On hold)|(Finalizing)/);
  await validate_can_delete_assistance();
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
  await page.type("[placeholder='To... Destination']", 'tlv');
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

async function click_on_send_request() {
  await page.click(".btn--primary");
}

async function fill_reference_fields() {
  if (true) {
    return;
  }
  await page.click("[id='el-collapse-content-1123'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6775-1127 > span");
  await page.click("body > :nth-child(19) .btn--primary");
}

async function validate_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function log_out_if_needed() {
  if (await isVisible(page, ".loginButtonSubmit")) {
    return;
  }
  await waitForText(page, "[ng-show='tripsViewMode==3'] > :nth-child(2)", 'Welcome on Board!');
  await page.click(".SignOut");
  await page.waitFor(3000);
}

async function log_in_to_the_agent___shugi_bugi() {
  await page.goto('https://2.gtp-staging.com/');
  await page.waitFor(3000);
  await log_out_if_needed();
  await page.type("#username", 'amy@deus.com');
  await page.type("#Password", 'MAGA!$$2k26');
  await page.click(".loginButtonSubmit");
  await waitForText(page, "[ng-show='mybookingsViewMode==MybookingsViewMode.Landing'] > :nth-child(2)", 'Welcome on Board!');
}

async function click_on_a_link_in_the_last_mail(linkNumber) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function add_2_flights() {
  await waitForText(page, "[ng-click='onFlightReSearchClicked($index,\'research\')'] .ng-binding", 'Search Online');
  await page.waitFor(2000);
  await page.click("[ng-click='onFlightReSearchClicked($index,\'research\')'] .ng-binding");
  await waitForText(page, "[ng-disabled='showLoadingSearch || IsDisableFlightSearch']", 'Search');
  await page.waitFor(2000);
  await page.click("#from0");
  await page.type("#from0", 'LHR');
  await page.waitFor(300);
  await page.click("#ui-id-8");
  await page.waitFor(500);
  await page.click("[ng-disabled='showLoadingSearch || IsDisableFlightSearch']");
  await waitForText(page, "[id='priceTd'] .ng-binding", 'Price');
  if (false) {
    await page.type("[ng-model='searchText']", 'IB');
  }
  await page.waitFor(300);
  await page.click("[id='button-flight0'] .trip-cart-icon-new");
  await waitForText(page, "[ng-class='{altertnativePackage:packageModel.IsAlternativePackageWasSelected}']", '1 Added');
  await page.click("[id='button-flight1'] .trip-cart-icon-new");
  await waitForText(page, "[id='searchResultGrid'] > div:nth-of-type(3) [ng-class='{altertnativePackage:packageModel.IsAlternativePackageWasSelected}']", '1 Added');
  await page.click("#ss");
}

async function add_2_cars() {
  await waitForText(page, "[ng-click='onCarReSearchClicked($index,\'research\')'] .ng-binding", 'Search Online');
  await page.click("[ng-click='onCarReSearchClicked($index,\'research\')'] .ng-binding");
  await waitForText(page, "[data-ng-click='onSearchCarsClicked()']", 'Search');
  await page.click("[data-ng-click='onSearchCarsClicked()']");
  await waitForText(page, "[data-ng-click='onSortHeaderClicked(rentalAgencySort)']", 'Rental Agency');
  await page.click("[id='carItem0'] .trip-cart-icon-new");
  await waitForText(page, "[ng-hide='bookingInProgress || bookingSucceeded || bookingFailed'] .ng-binding", 'Added');
  await page.click("[id='carItem1'] .trip-cart-icon-new");
  await waitForText(page, "[id='carItem1'] [ng-hide='bookingInProgress || bookingSucceeded || bookingFailed'] .product-added-label", 'Added');
  await waitForText(page, "#as > span", '6');
  await page.click("#ss");
}

async function validate_number_of_quotes() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_overview_tab() {
  await waitForText(page, ".page-layout-right p", 'Your cart is empty');
  await waitForText(page, "#tab-overview > div", 'Overview');
  await page.click("[id='tab-overview'] p");
  await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  await waitForText(page, "[class^='my'], [class*=' my'] h2", 'Suggested items');
  await waitForText(page, "[class^='my'], [class*=' my'] > :nth-child(2) .has-text-weight-semibold", 'Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States');
  await waitForText(page, "[aria-describedby='el-tooltip-8878']", 'Pending booking');
  await waitForText(page, "[class^='my'], [class*=' my'] > :nth-child(3) .has-text-weight-semibold", 'Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States');
  await waitForText(page, "[aria-describedby='el-tooltip-2508']", 'Pending booking');
  await waitForText(page, "[idx='2'] .has-text-weight-semibold", 'Flight to Tel Aviv');
  await waitForText(page, "[aria-describedby='el-tooltip-4498']", 'Pending booking');
  await waitForText(page, "[idx='3'] .has-text-weight-semibold", 'Flight to Tel Aviv');
  await waitForText(page, "[aria-describedby='el-tooltip-884']", 'Pending booking');
  await validate_number_of_quotes();
}

async function validate_number_of_quotes_1() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_requests_tab() {
  await scrollToElement(page, "[id='tab-requests'] p");
  await waitForText(page, "#tab-requests > div", 'Requests');
  await page.click("[id='tab-requests'] p");
  await waitForText(page, "#el-collapse-head-8660 > h4", 'Travel request items');
  if (false) {
    await waitForText(page, "[idx='0'] .title-container h5", 'flight          to          Ben Gurion APT, IL (TLV)');
  }
  await waitForText(page, "[idx='0'] .center-title", 'Requested flight            to            Ben Gurion APT, IL (TLV)');
  if (false) {
    await waitForText(page, "[idx='1'] .title-container h5", 'car at John F. Kennedy Intl. (JFK),New York, NY, United States');
  }
  await waitForText(page, "[idx='1'] .center-title", 'Requested car in John F. Kennedy Intl. (JFK),New York, NY, United States');
  await waitForText(page, "[class^='my'], [class*=' my'] h2", 'Suggested items');
  await waitForText(page, "[class^='my'], [class*=' my'] > :nth-child(2) .has-text-weight-semibold", 'Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States');
  await waitForText(page, "[aria-describedby='el-tooltip-8878']", 'Pending booking');
  await waitForText(page, "[class^='my'], [class*=' my'] > :nth-child(3) .has-text-weight-semibold", 'Hire a car at John F. Kennedy Intl. (JFK),New York, NY, United States');
  await waitForText(page, "[aria-describedby='el-tooltip-2508']", 'Pending booking');
  await waitForText(page, "[idx='2'] .has-text-weight-semibold", 'Flight to Tel Aviv');
  await waitForText(page, "[aria-describedby='el-tooltip-4498']", 'Pending booking');
  await waitForText(page, "[idx='3'] .has-text-weight-semibold", 'Flight to Tel Aviv');
  await waitForText(page, "[aria-describedby='el-tooltip-884']", 'Pending booking');
  await validate_number_of_quotes_1();
}

async function add_first_car_and_last_flight_to_the_cart() {
  await scrollToElement(page, "[id='tab-overview'] p");
  await page.click("[id='tab-overview'] p");
  //TODO Please add an assertion here
await getText(page, "[class^='my'], [class*=' my'] > :nth-child(2) .amount");
  await page.click("[class^='my'], [class*=' my'] > :nth-child(2) .btn");
  //TODO Please add an assertion here
await getText(page, "[idx='3'] .amount");
  await page.click("[idx='3'] .add-btn");
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

async function validate_prices() {
  await waitForText(page, ".last .amount", '$'+carPrice);
  await waitForText(page, ".flight-quote-summary .quote-price .amount", '$'+flightPrice);
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await validate_number1_number2_number3(carPrice, flightPrice, totalPrice);
}

async function validate_number_of_quotes_2() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_2_added() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_2_added_in_suggested_items() {
  // Converting a 'validation-code-step' step has to be done manually at this time
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function proceed_to_checkout_and_submit_for_approvals() {
  await scrollToElement(page, ".tabs-container .car-quote-card .el-checkbox__inner");
  await page.click(".tabs-container .car-quote-card .el-checkbox__inner");
  await scrollTo(page, 0, 682);
  await page.click(".error-border .el-checkbox__inner");
  await page.waitFor(500);
  await page.click(".btn-container span");
  await Price_change_prompt();
  await waitForText(page, ".contact-details-container [class^='is-size'], [class*=' is-size']", 'Contact details');
  await waitForText(page, ".email-input [type='text']", 'Asi@Stance.com');
  await page.click(".is-hidden-mobile");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function validate_can_delete_assistance() {
  await page.click("[id='tab-requests'] p");
  await waitForText(page, "#el-collapse-head-752 > h4", 'Travel request items');
  await page.click("[idx='0'] .delete-icon");
  await page.click("body > :nth-child(13) .btn--primary");
  await Success_toast_alert();
  await page.waitFor(2000);
  await page.click(".delete-icon");
  await page.click("body > :nth-child(14) .btn--primary");
  await Success_toast_alert();
}

