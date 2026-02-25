/*
 * Test Name: 35003 Southwest - Corporate, By Schedule, mixed brands > Brand info
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2025-04-07T12:39:37Z
 * Updated: 2026-01-08T08:58:08Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('southwest@corp.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_round_trip_by_schedule__no_stops__Southwest_('SAN', 'Las Vegas');
  await Flight___Results___Wait_for__Select__text();
  await Flight___Click__Pricing_Options_();
  await Wanna_Get_Away___View_brand_info_and_Select();
  await Flight___Click__Pricing_Options_();
  await Anytime___View_brand_info_and_Select();
  await Add_to_cart();
  await Pending_booking___wait_for_element_text();
  await Validate_brand_info_in_cart__before_checkout();
  await Add_FOP();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
  await Validate_brand_info_in_cart__before_checkout_1();
  await Trip_Cancelation___warning_and_continue();
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

async function Search_flight_round_trip_by_schedule__no_stops__Southwest_(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id='el-id-520-61'] .arrow-right");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click("[class^='mt'], [class*=' mt']");
  await page.type("#el-id-3037-4613", 'wn');
  await page.click("#el-id-3037-4500");
  await page.click(".flight-more-search-inputs > :nth-child(1) [fill='currentColor']");
  await page.click("#el-id-2220-1027 > span");
  await waitForText(page, ".flight-more-search-inputs > :nth-child(1) .el-select__selection span", 'No stops');
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Wanna_Get_Away___View_brand_info_and_Select() {
  await page.click("[aria-label='Pricing Options'] .flicking-camera > section:nth-of-type(1) .brand-name");
  await waitForText(page, "[aria-label='Branded fares'] .el-tabs__content > :nth-child(2) .service-item-title", 'Free');
  //TODO Please add an assertion here
await getText(page, "[aria-label='Branded fares'] .brand-name");
  //TODO Please add an assertion here
await getText(page, "[aria-label='Branded fares'] .el-tabs__content");
  await page.click("[aria-label='Branded fares'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".pricing-options-section > :nth-child(1) .btn--primary");
  await waitForText(page, ".pricing-options-section > :nth-child(1) .btn--primary", 'Unselect');
  await page.click(".add-btn");
  await waitForText(page, ".change-flight-btn", 'Change flight');
}

async function Anytime___View_brand_info_and_Select() {
  await page.click("[aria-label='Pricing Options'] .flicking-camera > :nth-child(3) .brand-name");
  await waitForText(page, "[aria-label='Branded fares'] .el-tabs__content > :nth-child(2) .service-item-title", 'Free');
  //TODO Please add an assertion here
await getText(page, "[aria-label='Branded fares'] .brand-name");
  //TODO Please add an assertion here
await getText(page, "[aria-label='Branded fares'] .el-tabs__content");
  await page.click("[aria-label='Branded fares'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".pricing-options-section > :nth-child(3) .btn--primary");
  await waitForText(page, ".selected", 'Unselect');
  await page.click(".add-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_to_cart() {
  await waitForText(page, ".app-page-layout .pricing-options-container > :nth-child(1) .title", 'Your selection');
  await page.click(".app-page-layout .pricing-options-container > :nth-child(1) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Validate_brand_info_in_cart__before_checkout() {
  await page.click(".more-details-btn");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .carrier-name", 'Southwest Airlines');
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) .btn");
  await waitForText(page, "[id='pane-overview'] .el-tabs__content > :nth-child(2) .service-item-title", 'Free');
  await waitForText(page, "[id='pane-overview'] .el-tabs__content", brandOne);
  await page.click("[aria-label='Branded fares'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .btn", brandNameOne);
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .carrier-name", 'Southwest Airlines');
  await page.click(".flight-details > :nth-child(1) > :nth-child(4) .btn");
  await waitForText(page, "[id='pane-overview'] .el-tabs__content > :nth-child(2) .service-item-title", 'Free');
  await page.click("[aria-label='Branded fares'] [fill='currentColor']");
  await waitForText(page, "[id='pane-overview'] .el-tabs__content", brandTwo);
  await page.click("[aria-label='Branded fares'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(4) .btn", brandNameTwo);
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .carrier-name", 'Southwest Airlines');
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Add_FOP() {
  await page.click(".add-form-payment");
  await waitForText(page, ".box-card p", 'Invoice');
  await page.click(".checkbox-round");
  await page.click(".btn-save");
  await waitForText(page, ".fop-owner", 'Paid by  TMC');
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

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Validate_brand_info_in_cart__before_checkout_1() {
  await page.click(".more-details-btn");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .carrier-name", 'Southwest Airlines');
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) .btn");
  await waitForText(page, "[id='pane-overview'] .el-tabs__content > :nth-child(2) .service-item-title", 'Free');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .btn", BrandName1);
  await waitForText(page, "[id='pane-overview'] .el-tabs__content", Brand1);
  await page.click("[aria-label='Branded fares'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .carrier-name", 'Southwest Airlines');
  await page.click(".flight-details > :nth-child(1) > :nth-child(4) .btn");
  await waitForText(page, "[id='pane-overview'] .el-tabs__content > :nth-child(2) .service-item-title", 'Free');
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(4) .btn", BrandName2);
  await waitForText(page, "[id='pane-overview'] .el-tabs__content", Brand2);
  await page.click("[aria-label='Branded fares'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .carrier-name", 'Southwest Airlines');
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Trip_Cancelation___warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

