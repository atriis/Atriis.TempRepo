/*
 * Test Name: 69253 AFKL - Flights -  Fare rules displayed in Multi City search
 * Description: 
 * Status: Active
 * Labels: Fare Rules,Regression,Flights,Pricing Options,multi city,AFKL NDC Regression,Cart,results,Flight Details,additional pricing options,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-10-24T03:55:20Z
 * Updated: 2025-12-17T08:25:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("bsafkl@bsafkl.com");
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_multi_city('CDG', 'WAW', 'BER', 'CDG');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Flight___Fare_Rules___Results_page_and_cart();
  await Flight___Fare_Rules___Pricing_Options();
  await Flight___Results___Flight_Details();
  await Add_flight_from_results_page_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Flight___Fare_Rules___Results_page_and_cart_1();
  await Flight___Fare_Rules___Price_Breakdown_in_cart();
  await Flight___Fare_Rules___Price_Breakdown_in_cart_1();
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

async function Search_flights_multi_city(firstFrom, firstTo, secondFrom, secondTo) {
  await page.click("[id='tab-flight'] p");
  await page.click("[id='el-id-2216-47'] > :nth-child(3) .el-radio__label");
  await page.click(".add-flight-btn");
  await page.type("#el-id-2216-72", firstFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-73", firstTo);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-89", secondFrom);
  await page.click(".autocomplete-result");
  await page.type("#el-id-2216-90", secondTo);
  await page.click(".autocomplete-result");
  await page.click("#el-id-2216-74");
  await page.click("#el-id-2216-65 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("#el-id-2216-65 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("[id='el-id-2216-65'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-2216-91");
  await page.click("[id='el-id-2216-82'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Flight___Fare_Rules___Results_page_and_cart() {
  await waitForText(page, ".fare-rules-btn", 'Fare rules');
  await page.click(".fare-rules-btn");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-1");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-2");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
}

async function Flight___Click__Pricing_Options_() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--default", 'Pricing Options');
  await page.click(".flight-list > :nth-child(1) .btn--default");
  await waitForText(page, ".options-header p", /option/);
}

async function Flight___Fare_Rules___Pricing_Options() {
  await Flight___Click__Pricing_Options_();
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.waitFor(1000);
  await scrollToElement(page, ".flicking-camera > :nth-child(1) .link-style");
  await page.waitFor(1000);
  await page.click(".pricing-options-section > section:nth-of-type(1) .link-style");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.waitFor(1000);
  await page.click(".pricing-options-section > :nth-child(1) .btn--primary");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".main-info-wrapper .link-style");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.click(".select-btn");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click(".pricing-options-section > section:nth-of-type(1) .link-style");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Flight___Results___Flight_Details() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await waitForText(page, "[aria-label='Flight details'] .link-style", 'Fare rules');
  await page.click("[aria-label='Flight details'] .link-style");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-1");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-2");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
  await page.click("#logged-in-page > div > section > section > main > section > main > section > div:nth-child(4) > div > header > button > i > svg > path");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Flight___Fare_Rules___Results_page_and_cart_1() {
  await waitForText(page, ".fare-rules-btn", 'Fare rules');
  await page.click(".fare-rules-btn");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-1");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-2");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
}

async function Flight___Fare_Rules___Price_Breakdown_in_cart() {
  await waitForText(page, ".price-breakdown-btn", 'Price Breakdown');
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".price-breakdown-segment > :nth-child(1)", /Validation carrier/);
  await page.click(".app-footer .btn--text");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-1");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-2");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
}

async function Flight___Fare_Rules___Price_Breakdown_in_cart_1() {
  if (true) {
    return;
  }
  await waitForText(page, ".price-breakdown-btn", 'Price Breakdown');
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".price-breakdown-segment > :nth-child(1)", /Validation carrier/);
  await page.click(".app-footer .btn--text");
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-1");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#tab-2");
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await waitForText(page, ".note > :nth-child(1)", 'Please note:');
  await page.click("#el-drawer__title > button > i");
}

