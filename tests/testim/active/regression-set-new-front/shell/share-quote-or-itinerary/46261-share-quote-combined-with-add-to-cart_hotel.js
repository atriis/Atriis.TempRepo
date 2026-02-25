/*
 * Test Name: 46261 Share quote combined with add to cart - hotel
 * Description: 
 * Status: Active
 * Labels: share quote,results,Role,Cart,No Amadeus Hotel Book,Hotel,Regression,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-05-21T11:53:11Z
 * Updated: 2024-08-20T06:30:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('sher@adto.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('LON');
  await NL___fill_ref_field_education_and_courses();
  await page.click(".hotel-list > :nth-child(1) .see-availability-btn");
  await take_flight_details();
  await share_hotel();
  await in_case_of_conflicting_quote();
  await validate_flight_in_cart();
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

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
}

async function take_flight_details() {
  await waitForText(page, "#tab-amenities", 'Amenities');
  await scrollTo(page, 0, 700);
  //TODO Please add an assertion here
await getText(page, ".room-list > :nth-child(2) .amount");
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function share_hotel() {
  await scrollToElement(page, ".page-view .is-size-4");
  await page.click(".page-view .is-size-4");
  await page.click(".room-list > :nth-child(2) .share-btn");
  await page.waitFor(1000);
  await page.click(".share-bar .share-btn");
  await waitForText(page, ".em_dark_grey_txt", 'Price Offer - Summary');
  await page.click("body > :nth-child(12) .btn--primary");
  await Success_toast_alert();
}

async function in_case_of_conflicting_quote() {
  if (await getText(page, ".conflicting-quotes-dialog [class^='mr'], [class*=' mr']") !== "'      Proceed    '") {
    return;
  }
  await page.click("[class^='mr'], [class*=' mr']");
  await waitForText(page, ".page-layout-main .amount", price);
}

async function validate_flight_in_cart() {
  if (await getText(page, ".app-filter__content > :nth-child(5) .filter-title") !== "'Suppliers'") {
    return;
  }
  await page.click(".cart-btn .material-symbols-outlined");
  await waitForText(page, ".page-layout-main .amount", price);
}

