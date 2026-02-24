/*
 * Test Name: 65540 Transferz - validate "Booking code"
 * Description: 
 * Status: Active
 * Labels: Transferz Regression,Cart,Complete trip,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-08-13T05:13:11Z
 * Updated: 2025-09-29T02:42:41Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@transferez.am');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Groundscope___from_Airport_to_Specific_Address('LHR', 'Emirates');
  await add_transferz_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Groundscope___Add_contact_details_in_cart();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Book_and_finalize();
  await Validate_Booking_Code_on_Cart();
  await Validate_Share_Quote();
  await Validate_Share_Itinerary();
  await Trip_Cancelation___Warning_and_continue();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
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

async function Search_Groundscope___from_Airport_to_Specific_Address(pickUp, dropOff) {
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

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_transferz_from_results_page_to_cart() {
  await waitForText(page, ".desktop-btn", 'Add to trip');
  await page.click(".desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Groundscope___Add_contact_details_in_cart() {
  await waitForText(page, ".el-tabs .card-title", /Contact Information/);
  await page.click(".ticket-layout-container .is-clickable");
  await page.type("[maxlength='3']", '351');
  await page.type(".control > div:nth-of-type(2) [type='number']", '96');
  await page.type(".control > div:nth-of-type(3) [type='number']", '566785');
  await page.click(".tabs-container .no-border");
  await page.waitForSelector(".filled", {state: "visible"});
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
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

async function Validate_Booking_Code_on_Cart() {
  await waitForText(page, ".box-left-center > :nth-child(2) .pnr-code", new RegExp('Booking Code:\\s+\\S+'));
}

async function Click_on_share_quote_from_the_cart() {
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-8844 > li:nth-child(1)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Validate_Share_Quote() {
  await Click_on_share_quote_from_the_cart();
  await waitForText(page, "[bgcolor='#1C73FF'] tr > :nth-child(1) > :nth-child(3) > :nth-child(3)", new RegExp('Booking Code:\\s+\\S+'));
  await page.click(".radio-btns > :nth-child(2) .el-radio__inner");
  await waitForText(page, "[bgcolor='#1C73FF'] tbody > :nth-child(2) > :nth-child(1) > :nth-child(3)", new RegExp('Booking Code:\\s+\\S+'));
  await page.click(".is-justify-content-flex-end > :nth-child(1)");
}

async function Click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Validate_Share_Itinerary() {
  await Click_on_share_itinerary_from_cart();
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > tr:nth-of-type(2) td", new RegExp('Booking Code:\\s+\\S+'));
  await page.click(".is-justify-content-flex-end > :nth-child(1)");
}

async function Trip_Cancelation___Warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

