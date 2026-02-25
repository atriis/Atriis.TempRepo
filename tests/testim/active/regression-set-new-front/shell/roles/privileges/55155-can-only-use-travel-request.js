/*
 * Test Name: 55155 Can Only Use Travel Request
 * Description: 
 * Status: Active
 * Labels: Regression,Role,Privileges,Request Assistance,No Amadeus Hotel Book,Hotel,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2025-01-27T01:03:35Z
 * Updated: 2026-02-17T06:49:47Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Travel@Requestonly.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await validate_search_button_is_not_visible();
  await validate_can_see_travel_request_button();
  await validate_can_send_travel_request();
  //TODO Please add an assertion here
await getText(page, ".trip-title");
  await login_with_agent();
  await add_product_to_the_cart__from_the_agent_();
  await corporate___refresh_and_add_the_product_from_assistance();
  await validate_can_t_proceed_to_checkout();
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

async function validate_search_button_is_not_visible() {
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function validate_can_see_travel_request_button() {
  await waitForText(page, ".btn--size-large", 'support_agent Travel request');
}

async function Copy_of_Request_assistance__hotel(destination) {
  await page.click("#tab-hotel > div");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", destination);
  await page.waitFor(1000);
  await sendSpecialCharacter(page, "#el-id-7300-759", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(3)");
  await page.click("[id='el-id-8992-70'] .is-right tbody > :nth-child(5) > :nth-child(4)");
  await page.click(".btn--size-large");
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function validate_can_send_travel_request() {
  await Copy_of_Request_assistance__hotel('lon');
  await waitForText(page, ".title-wrapper p", 'Plan your trip with our trusted agents');
  await scrollToElement(page, ".btn--primary");
  await page.click(".btn--primary");
  await page.click("body > :nth-child(20) .btn--primary");
  await Success_toast_alert();
  await waitForText(page, ".success-message__title", 'Sent to agent');
  await waitForText(page, ".success-message__description", 'Your request was successfully created');
  await page.click(".btn-container > :nth-child(1)");
}

async function login_with_agent() {
  await page.goto('https://2.gtp-staging.com/');
  await page.waitFor(4000);
  if (await getText(page, "[ng-click='signOutClick()']") === "'Sign out'") {
    await page.click("[ng-click='signOutClick()']");
  }
  await waitForText(page, "#userNameTextBox > label", 'Username');
  await page.type("#username", 'amy@deus.com');
  await page.type("#Password", 'MAGA!$$2k26');
  await page.click(".loginButtonSubmit");
  await waitForText(page, "[ng-show='mybookingsViewMode==MybookingsViewMode.Landing'] > :nth-child(2)", 'Welcome on Board!');
}

async function add_product_to_the_cart__from_the_agent_() {
  await page.goto('https://2.gtp-staging.com/Trip/' +tripNumber);
  await waitForText(page, "[ng-show='isShowReSearch() && !isMybookingsPage'] .ng-binding", 'Search Online');
  await page.click("[ng-show='isShowReSearch() && !isMybookingsPage'] .ng-binding");
  await waitForText(page, "[ng-hide='isCorporateUser'] .block-display", 'Include Special Rate:');
  await page.click("[data-ng-click='onSearchHotelsClicked()']");
  await waitForText(page, ".filter-sort-by", 'Sort by:');
  await page.click("[id='hotelItem0'] [ng-switch='isPriceOffer'] .ng-binding");
  await page.click(".room-container > div:nth-of-type(3) > div:nth-of-type(1) .trip-cart-icon-new");
  await waitForText(page, "[ng-hide='bookingInProgress || bookingSucceeded || bookingFailed'] .ng-binding", '1 Added');
}

async function refresh_tab() {
  await page.reload();
}

async function corporate___refresh_and_add_the_product_from_assistance() {
  await refresh_tab();
  await scrollToElement(page, "[class^='my'], [class*=' my'] .btn");
  await page.click("[class^='my'], [class*=' my'] .btn");
  await scrollToElement(page, "[id='tab-overview'] p");
  await page.click("[id='tab-overview'] p");
}

async function validate_can_t_proceed_to_checkout() {
  await waitForText(page, ".pending-booking", 'Pending booking');
  await page.click(".el-checkbox__inner");
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

