/*
 * Test Name: 62008 Benerail Moove - Ticket is refundable in itinerary after booking
 * Description: 
 * Status: Active
 * Labels: Rail,Benerail Moove Regression,Full Purchase,Share Itinerary,progress page,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-09T09:56:34Z
 * Updated: 2026-01-21T09:41:06Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('beny@moove.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_benerail_by_place_one_way('DEBHF', 'Bruxelles-Midi (BE)');
  await click_on_proceed_after_search();
  await Benerail___Results___Wait_for__Select__text();
  await Checking_if_the_route_is_the_correct_one();
  await Add_Benerail_one_way_from_search_results_to_cart();
  await Checking_if_the_route_is_the_correct_one_1();
  await Validating_ticket_is_refundable();
  await Seating_sellect();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await Rails___Trip_Overview___Wait_for__More_details__display();
  await Validating_that_ticket_is_refundable_in_itinerary_after_booking();
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

async function Search_benerail_by_place_one_way(from, to) {
  await page.waitForSelector("#tab-rails", {state: "visible"});
  await page.click(".el-tabs__header .el-select__caret");
  await page.click("#el-id-9714-23 > span");
  await page.click(".el-radio-group > :nth-child(2) .el-radio__label");
  await page.type("#el-id-9376-136", from);
  await page.click(".autocomplete-result");
  await page.type("#el-id-9376-266", to);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click(".from-row [placeholder='Date']");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Benerail___Results___Wait_for__Select__text() {
  await waitForText(page, ".rail-list > section:nth-of-type(1) [class^='btn--width'], [class*=' btn--width']", 'Select');
}

async function Checking_if_the_route_is_the_correct_one() {
  await waitForText(page, ".rail-list > section:nth-of-type(2) [class^='btn--width'], [class*=' btn--width']", 'Select');
  await waitForText(page, ".rail-list > :nth-child(2) .supplier-name", 'InterCity Express');
  await page.click(".rail-list > :nth-child(1) .btn--secondary");
  await waitForText(page, ".rail-list > :nth-child(1) .ticket-bottom > div:nth-of-type(1) > section:nth-of-type(4) .alternative-description > :nth-child(2) .muliSemiBold", 'Full flex');
  if (false) {
    await waitForText(page, ".rail-list > section:nth-of-type(2) .eu-rail-route-details > :nth-child(1) > :nth-child(2) .supplier-name", 'NMBS/SNCB');
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_Benerail_one_way_from_search_results_to_cart() {
  await page.click(".rail-list > :nth-child(1) .ticket-bottom > div:nth-of-type(1) > section:nth-of-type(4) .btn--primary");
  await waitForText(page, ".add-rail-btn", 'Add to trip');
  await page.click(".add-rail-btn");
  await Pending_booking___wait_for_element_text();
}

async function Checking_if_the_route_is_the_correct_one_1() {
  await waitForText(page, ".eu-rail-route-details > :nth-child(1) > :nth-child(1) .supplier-name", 'Deutsche Bahn');
  if (false) {
    await waitForText(page, ".eu-rail-route-details > :nth-child(1) > :nth-child(2) .supplier-name", 'NMBS/SNCB');
  }
}

async function Validating_ticket_is_refundable() {
  await page.click(".ticket-subtitle > :nth-child(5) .btn");
  await waitForText(page, ".rules-list > :nth-child(2) > :nth-child(3) .info-text", /Before 1st day of validity 100% refund/);
  await page.click("body > :nth-child(31) [fill='currentColor']");
}

async function Seating_sellect() {
  await page.click(".seats .is-clickable");
  await page.click(".seats .mr-auto .el-checkbox__inner");
  await page.click("[id='pane-overview'] .btn--primary");
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

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Rails___Trip_Overview___Wait_for__More_details__display() {
  await waitForText(page, "[class^='pl'], [class*=' pl'] span", 'More details');
}

async function click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Validating_that_ticket_is_refundable_in_itinerary_after_booking() {
  await click_on_share_itinerary_from_cart();
  await waitForText(page, "body > :nth-child(2) .em_full_wrap > :nth-child(1) > :nth-child(2) [bgcolor='#ffffff'] > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(7) .em_grey_txt", /Refundable Before Departure/);
  await page.click(".show-close [xmlns='http://www.w3.org/2000/svg']");
}

