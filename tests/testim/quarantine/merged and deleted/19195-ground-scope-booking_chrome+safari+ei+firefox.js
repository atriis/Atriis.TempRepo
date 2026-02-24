/*
 * Test Name: 19195 Ground Scope booking  CHROME+SAFARI+EI+FIREFOX
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2023-06-09T02:10:43Z
 * Updated: 2025-05-20T10:21:55Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('elisabete@groundscope.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await page.click("[id='tab-groundService'] p");
  await Groundscope_search('LON', "london bridge");
  await waitForText(page, ".results-amount", /Showing/);
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await waitForText(page, "[aria-describedby='el-tooltip-2768']", 'Pending booking');
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await page.waitFor(4000);
  await waitForText(page, ".ticket-bottom .card-title", /Contact Information/);
  await Groundscope___Add_contact_details();
  await page.click(".el-checkbox__inner");
  await Add_credit_card_in_cart();
  await page.waitForSelector("#el-collapse-head-1212", {state: "visible"});
  await set_cvv();
  await Groundscope_checkout();
  await waitForText(page, ".success-message__title", 'Success');
  await page.click(".btn-container > :nth-child(1)");
  await page.waitForSelector(".icon-img-wrapper", {state: "visible"});
  await scrollTo(page, 0, 88.33332824707031);
  await Groundscope_validate_booking_details();
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Groundscope_search(pickUp, dropOff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", pickUp);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", dropOff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("[placeholder='Pick-up time']");
  await page.type("#el-id-1402-690", 'all vehicle types');
  await page.click("[id*='id'] span");
  await page.waitFor(1000);
  await page.click(".details-container > :nth-child(2) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6660-916 > span");
  await page.click(".ground-transport-search-content");
  await page.click(".ground-transport-search-content");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper ']");
  //TODO Please add an assertion here
await getText(page, "[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.click(".search-btn");
}

async function Groundscope___Add_contact_details() {
  await waitForText(page, ".el-tabs .card-title", /Contact Information/);
  await page.click(".ticket-layout-container .is-clickable");
  await page.type("[maxlength='3']", '351');
  await page.type(".control > div:nth-of-type(2) [type='number']", '96');
  await page.type(".control > div:nth-of-type(3) [type='number']", '566785');
  await page.click(".tabs-container .no-border");
  await page.waitForSelector(".filled", {state: "visible"});
}

async function Credit_Guard_modal_insert_cc_number(ccNumber) {
  await page.click("[placeholder='Please enter your credit card number']");
  await page.type("[placeholder='Please enter your credit card number']", ccNumber);
  await page.waitFor(500);
  await page.click("body > :nth-child(14) .btn--primary");
}

async function Add_credit_card_in_cart() {
  await page.click(".add-form-payment");
  await page.click(".add-credit");
  await page.click(".form-inputs > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4685-522 > div > div:nth-child(1) > span");
  await page.type("[placeholder='Card holder name']", 'Sunny Atriis');
  await page.click(".form-inputs > :nth-child(5) > :nth-child(1) .el-select__caret");
  await page.click("#el-id-2829-778");
  await page.click(".form-inputs > :nth-child(5) > :nth-child(2) .el-select__caret");
  await page.click("#el-id-2829-1079 > span");
  await page.click(".is-transparent span");
  await page.type("#el-id-2829-1375", 'israel');
  await page.click("#el-id-2829-1492 > span");
  await page.type("[placeholder='City name']", 'Tel Aviv Yafo');
  await page.type("[placeholder='Zip code']", '6654115');
  await page.type("[placeholder='Street name']", 'Yigal Alon 30');
  await page.click(".insertCard");
  await Credit_Guard_modal_insert_cc_number(4580458045804580);
  await page.waitFor(1000);
  await page.click(".btn-save");
  await waitForText(page, ".successfully-saved", /Payment added successfully/);
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function set_cvv() {
  await page.click("[type='number']");
  await page.type("[type='number']", '122');
}

async function Groundscope_checkout() {
  await page.click(".btn-container span");
  await waitForText(page, ".trip-checkout-stepper > :nth-child(2) .page-title", 'Booking details');
  await waitForText(page, ".quote-summary-list > :nth-child(1) .amount", '€0.00');
  await waitForText(page, "#el-collapse-head-7465 > div > span", 'Travellers Reference Questions');
  await scrollToElement(page, ".is-hidden-mobile");
  await page.click(".is-hidden-mobile");
}

async function Groundscope_validate_booking_details() {
  await waitForText(page, ".pnr-code", /PNR/);
  await waitForText(page, ".amount", pricevalue);
  await waitForText(page, ".pickup-link", Pickupvalue);
  await waitForText(page, ".links-container > :nth-child(2) [target='_blank']", Dropoffvalue);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

