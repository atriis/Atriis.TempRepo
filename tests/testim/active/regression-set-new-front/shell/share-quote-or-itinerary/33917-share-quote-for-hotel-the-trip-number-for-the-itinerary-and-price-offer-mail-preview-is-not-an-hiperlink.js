/*
 * Test Name: 33917 Share quote for hotel: the trip number for the itinerary and price offer mail preview is not an hiperlink
 * Description: 
 * Status: Active
 * Labels: CR7,Regression,No Amadeus Hotel Book,Fit for Prod,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-06-09T04:23:36Z
 * Updated: 2025-07-21T10:33:12Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('London, UK');
  await Hotel___View_Rates();
  await Hotel___Share_quotes_selection();
  await Validate_trip_number_is_not_hyperlink_2();
  await Hotel___Add_to_trip();
  await Pending_Booking___Wait_for_element_text();
  await Validate_trip_number_is_not_hyperlink_in_share_itinerary_cart();
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function Hotel___Wait_for__View_rates__text_in_results_page() {
  await waitForText(page, ".hotel-list > :nth-child(1) .extra-info a", 'View rates');
}

async function Hotel___View_Rates() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function Hotel___Share_quotes_selection() {
  await page.click(".main-layout .is-size-4");
  await scrollToElement(page, ".room-list > :nth-child(2) .share-btn");
  await page.click(".room-list > :nth-child(2) .share-btn");
  await page.click(".room-list > :nth-child(3) .share-btn");
  await page.click(".share-bar .share-btn");
  await page.waitForSelector(".share-quotes-form > :nth-child(3) .label", {state: "visible"});
}

async function Validate_trip_number_is_not_hyperlink(element) {
  await page.evaluate((element) => {
    if (element.hasAttribute("href")){
        return false
    }
    
  }, element);
}

async function Validate_trip_number_is_not_hyperlink_1() {
  await Validate_trip_number_is_not_hyperlink("body > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody:nth-child(2) > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr > td > span:nth-child(7)");
}

async function Validate_trip_number_is_not_hyperlink_2() {
  await page.click("body > table > tbody > tr > td > table > tbody > tr:nth-child(3) > td > table > tbody > tr > td.em_side_space > table > tbody:nth-child(2) > tr:nth-child(1) > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr > td");
  await Validate_trip_number_is_not_hyperlink_1();
  await page.click("[aria-label='Share Quotes'] > :nth-child(1) .el-dialog__close");
  await page.click(".share-bar .is-clickable");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Hotel___Add_to_trip() {
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Validate_trip_number_is_not_hyperlink_3(element) {
  await page.evaluate((element) => {
    if (element.hasAttribute("href")){
        return false
    }
    
  }, element);
}

async function Validate_trip_number_is_not_hyperlink_4() {
  await scrollToElement(page, "[align='right'] .em_grey_txt > :nth-child(14)");
  await page.click("[align='right'] .em_grey_txt > :nth-child(14)");
  await Validate_trip_number_is_not_hyperlink_3("[align='right'] .em_grey_txt > :nth-child(14)");
}

async function Validate_trip_number_is_not_hyperlink_in_share_itinerary_cart() {
  await Click_on_share_itinerary_from_cart();
  await Validate_trip_number_is_not_hyperlink_4();
  await page.click("[aria-label='Share Itinerary'] > :nth-child(1) .el-dialog__close");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

