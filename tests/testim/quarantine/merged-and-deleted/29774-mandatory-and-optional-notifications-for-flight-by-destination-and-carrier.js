/*
 * Test Name: 29774 mandatory and optional notifications for flight by destination and carrier
 * Description: mandatory and optional notifications appear in case searching for flight to zimbabwe, and in case adding emirates flight to zimbabwe to the cart
 * Status: Quarantine
 * Labels: Daily Shell
 * Owner: Shani Hadar
 * Created: 2023-06-06T09:07:50Z
 * Updated: 2023-09-04T07:05:59Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('tlv', 'zimbabwe');
  await NL___fill_ref_field_education_and_courses();
  await waitForText(page, "[role='alert'] p", 'optional notification for flight to Zimbabwe');
  await waitForText(page, ".mt5", 'mandatory notification for flight to Zimbabwe');
  await page.click(".el-checkbox__inner");
  await page.click("body > :nth-child(11) .btn");
  await page.click("[placeholder='Search flight']");
  await page.type("[placeholder='Search flight']", 'emirates');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, "[role='alert'] p", 'optional notification for emirates flight to Zimbabwe');
  await waitForText(page, ".mt5", 'mandatory notification for emirates flight to Zimbabwe');
  await page.click("body > :nth-child(11) .el-checkbox__inner");
  await page.click("body > :nth-child(11) .btn");
  await page.waitFor(2000);
  await refresh_tab_2();
  if (false) {
    await page.waitFor(2000);
  }
  await page.click(".btn-- .material-symbols-outlined");
  await waitForText(page, ".notification-container > div:nth-of-type(2) .notification-text > :nth-child(1)", 'optional notification for flight to Zimbabw ...');
  await waitForText(page, ".notification-container > div:nth-of-type(3) .notification-text > :nth-child(1)", 'optional notification for emirates flight t ...');
  await waitForText(page, ".notification-container > div:nth-of-type(5) .notification-message span", 'optional notification for flight to Zimbabw ...');
  await waitForText(page, ".notification-container > div:nth-of-type(6) .notification-message span", 'mandatory notification for flight to Zimbab ...');
  await waitForText(page, ".notification-container > div:nth-of-type(7) .notification-message span", 'optional notification for emirates flight t ...');
  await waitForText(page, ".notification-container > div:nth-of-type(8) .notification-message span", 'mandatory notification for emirates flight  ...');
  await delete_one_and_only_qoute_from_cart_before_checkout();
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

async function NL___fill_ref_field_education_and_courses() {
  await page.click("[name='Type of Trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("body > :nth-child(13) .btn--primary");
}

async function refresh_tab_2() {
  await page.reload();
}

async function delete_one_and_only_qoute_from_cart_before_checkout() {
  if (false) {
    //TODO Please add an assertion here
await isVisible(page, ".delete-icon");
  }
  if (false) {
    await page.click(".delete-icon");
  }
  await page.hover("[aria-controls='dropdown-menu-2222']");
  await page.click("[x-placement='bottom-end'] p");
  await page.click("[aria-label='Cancel item - '] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  if (false) {
    await page.click("body > :nth-child(12) .btn--primary");
  }
  if (false) {
    await waitForText(page, "[id='pane-overview'] p", 'No items yet, try searching products');
  }
  await page.click(".close-btn");
}

