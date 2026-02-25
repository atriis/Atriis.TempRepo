/*
 * Test Name: 61696 GroundScope - Car image is displayed in share quote and share itinerary email
 * Description: 
 * Status: Active
 * Labels: Groundscope Regression,share quote,Share Itinerary,price offer,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-07T09:11:57Z
 * Updated: 2025-08-04T10:47:10Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('elisabete@groundscope.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_Groundscope___from_Airport_to_Specific_Address('lhr', 'emirates');
  await Add_to_trip();
  await Car_image_is_displayed_in_share_quote_and_share_itinerary_email();
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

async function add_traveler___I_am_the_traveler() {
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip() {
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await Pending_booking___wait_for_element_text();
}

async function click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function click_on_share_quote_from_the_cart() {
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-8844 > li:nth-child(1)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Car_image_is_displayed_in_share_quote_and_share_itinerary_email() {
  await click_on_share_itinerary_from_cart();
  //TODO Please add an assertion here
await isVisible(page, "[alt='logo']");
  await page.click(".show-close [xmlns='http://www.w3.org/2000/svg']");
  await click_on_share_quote_from_the_cart();
  await waitForText(page, ".em_main_table [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(6) tr > :nth-child(1) > :nth-child(1)", 'Pickup:');
  //TODO Please add an assertion here
await isVisible(page, "[alt='logo']");
}

