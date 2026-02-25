/*
 * Test Name: Remarks Galileo flight hotel and car- corp
 * Description: galileo@UH7.api
CorporationId- 276222
AgencyId- 274129

TESTING-flight, hotel and car

* GDS RMs 
*Dynamic fields RMs
* RF RMs
 * Status: Draft
 * Labels: API regression
 * Owner: pini harush
 * Created: 2025-10-08T01:51:35Z
 * Updated: 2026-02-09T07:22:06Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login("galileo@UH7.api");
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_parallelly_flights_hotel_and_car('mad', 'lon');
  await search_fields();
  await Copy_of_Add_flight_from_results_page_to_cart();
  await PARALLELLY__Add_hotel_from_search_results_to_cart();
  await Add_car_from_results_page_to_cart();
  await accept_3_items_in_cart();
  await checkout_rf();
  await Book_and_finalize();
  await Validation_by_API_exact_input_DO_not_use_with_Regression_tag("Active on CORP-Flight-after booking-GDS,Active on CORP-Any-after booking-GDS,Active on CORP-Flight-after booking-GDS-only for specific corporate true,Active on CORP-Car-at ticketing-GDS,Active on CORP-HOTEL-at ticketing-GDS, RF QUESTION FOR BOOKER NEW TRIP STAGETESTIM, RF QUESTION FOR BOOKER CHECKOUT STAGETESTIM, Active on Corp and TMC-Flight-after booking-GDS", "Active on TMC-Any-after booking-GDS, Active on TMC-Any-after booking-GDS-only for specific corporate true, Active on TMC-Flight-after booking-GDS, Active on TMC-Flight-after booking-GDS-only for specific corporate, Active on CORP-Any-after booking-GDS-only for specific corporate false, Active on CORP-Flight-after booking-GDS-only for specific corporate disable", "galileo@UH7.api", "true", 1);
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

async function Book_a_new_trip() {
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

async function Search_parallelly_flights_hotel_and_car(from, to) {
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
  await page.click(".end-date .el-date-table-cell__text");
  await old_date_picker();
  await page.click(".is-align-flex-start .el-checkbox__inner");
  await page.click("[class^='py'], [class*=' py'] .control > :nth-child(2) .el-checkbox__inner");
  await page.click(".search-btn");
}

async function search_fields() {
  await page.click("#el-id-8010-306");
  await page.type("#el-id-8010-306", 'testim');
  await page.click("body > :nth-child(17) .btn--primary");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Copy_of_Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click("tbody > :nth-child(1) .el-table_1_column_4 .cell-price");
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

async function PARALLELLY__Add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function Add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function accept_3_items_in_cart() {
  await page.click(".flight-quote-card .el-checkbox__inner");
  await page.click("[id='pane-overview'] > :nth-child(1) > :nth-child(2) .el-checkbox__inner");
  await page.click(".car-quote-card .el-checkbox__inner");
  await page.click(".btn-container span");
}

async function checkout_rf() {
  await page.click("#el-id-2646-92");
  await page.type("#el-id-2646-92", 'testim');
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

async function getTripId() {
  await page.evaluate(() => {
    const url = window.location.href;
    const match = url.match(/trips\/(\d+)\//);
    
    if (!match) {
      throw new Error("Trip number not found in URL: " + url);
    }
    
    var tripNumber = match[1];
    exportsTest.tripNumber = tripNumber;
    console.log("Trip Number:", tripNumber);
  });
}

async function getUrlTripNumber() {
  await getTripId();
}

async function sleepInMinutes() {
  await page.evaluate(() => {
        var sleepInMinutes = sleepInMinutes ?? 5;
        const end = Date.now() + sleepInMinutes * 60000;
        while (Date.now() < end) { }
        console.log(`Sleep completed: ${sleepInMinutes} minute${sleepInMinutes !== 1 ? 's' : ''}`);
    
  });
}

async function Copy_of_API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function Copy_of_Api_Validation__Remarks(reqRemarks, fbRemarks) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Cancel_Trip_on__true___boolean__cancelQuote__parameter_() {
  const boolean_47 = await page.evaluate(() => {
    return cancelQuote === true || cancelQuote === "true";
    
  }).catch(() => false);
  if (!boolean_47) {
    return;
  }
  // Converting a 'api-action' step has to be done manually at this time
}

async function Validation_by_API_exact_input_DO_not_use_with_Regression_tag(requiredRemarks, forbiddenRemarks, username, cancelQuote, sleepInMinutes) {
  await getUrlTripNumber();
  await sleepInMinutes();
  await Copy_of_API_Validation__AuthForAPi(username, "NextLevelAtriis25!", '58294d71f764436fa8282de44cb90cfd');
  await Copy_of_Api_Validation__Remarks(requiredRemarks, forbiddenRemarks);
  await API_Validation__Cancel_Trip_on__true___boolean__cancelQuote__parameter_();
}

