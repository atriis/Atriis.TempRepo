/*
 * Test Name: 41117 Manual Quote - Ground transportation, Other with image in cart
 * Description: 
 * Status: Active
 * Labels: Manual Quote,No Amadeus Hotel Book,additional fees,Club,Cart,performance,Groundscope Regression,progress page,Transportation,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-01-15T05:42:31Z
 * Updated: 2025-09-30T07:56:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('manualQuote@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_manual_quote___Ground_transport();
  await Add_manual_quote___Other();
  await Ground_transport___more_details__terms___conditions();
  await Checkout_to_complete_booking();
  await Validate_info_after_checkout();
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

async function Add_manual_quote___Ground_transport() {
  await page.click(".is-capitalized");
  await page.click("[id='tab-groundService'] p");
  await waitForText(page, ".other-products-form > :nth-child(5) .label", 'Comment');
  await page.click("[aria-activedescendant='el-autocomplete-4999-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-4999-item--1']", 'seattle');
  await page.click("[id='el-autocomplete-4999-item-0'] p");
  await page.click("[aria-activedescendant='el-autocomplete-171-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-171-item--1']", 'san juan island');
  await page.click("[id='el-autocomplete-171-item-0'] p");
  await page.click("[placeholder='Pick-up date']");
  await page.click(".el-zoom-in-top-enter-from [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > :nth-child(5)");
  await page.click("[id*='id']");
  await page.click("[id*='id'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-7790-2745 > span");
  await page.type("#el-id-2836-370", 'no limitation');
  await page.click(".manual-select [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-2836-345'] .el-vl__window div > :nth-child(1) span");
  await page.click(".is-danger .el-select__placeholder");
  await page.click("[id='el-id-9563-2813'] .el-vl__window div > :nth-child(1)");
  await page.type("#el-id-2150-373", '123');
  await page.type("#el-id-2150-374", '45');
  await page.type("#el-id-2150-375", '678');
  await page.type("#el-id-2836-371", 'SJ-90885');
  await page.type("#el-id-2836-376", '29');
  await page.type("#el-id-2836-377", '13.50');
  await page.click(".add-quote-btn");
  await waitForText(page, ".extra-info p", 'Pay On Departure');
}

async function Add_manual_quote___Other() {
  await page.click(".is-capitalized");
  await page.click("[id='tab-manualOtherProducts']");
  await waitForText(page, "[class^='mt'], [class*=' mt'] .label", 'Comment');
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2836-4976 > span");
  await page.click("#el-id-2836-5197");
  await page.click("[id='el-id-2836-5012'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-leave-from tbody > :nth-child(3) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-2836-5198");
  await page.click("[id='el-id-2836-5013'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-2836-5202", '15');
  await page.click(".add-quote-btn");
  await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  await scrollTo(page, 0, 439);
  //TODO Please add an assertion here
await isVisible(page, ".other-products-quote-card .box-card-container");
  await waitForText(page, ".details-container > :nth-child(2)", 'TypeHandlingFee');
  //TODO Please add an assertion here
await isVisible(page, ".last .material-symbols-outlined");
  await waitForText(page, ".other-products-quote-card .amount", '$15.00');
}

async function Ground_transport___more_details__terms___conditions() {
  await page.click(".more-details");
  await waitForText(page, ".parking-details-drawer h5", 'ACES TRANSPORTATION');
  await waitForText(page, ".parking-details-drawer .pickup-details .is-flex", 'seattle, wa, usa');
  await waitForText(page, ".parking-details-drawer .dropoff-details .is-flex", 'san juan island, washington, usa');
  await waitForText(page, ".subtotal > :nth-child(2)", /42.50/);
  await page.click("[islastquote='false'] [xmlns='http://www.w3.org/2000/svg']");
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

async function Checkout_to_complete_booking() {
  await page.click("[class^='btn--width'], [class*=' btn--width'] span");
  await waitForText(page, ".summary-title", 'Handling Fee');
  await book_and_finalize();
  await waitForText(page, ".el-tabs h5", 'ACES TRANSPORTATION');
}

async function Validate_info_after_checkout() {
  await waitForText(page, ".details-container > :nth-child(2)", 'TypeHandlingFee');
  await waitForText(page, ".other-products-quote-card .amount", /15.00/);
  await waitForText(page, "[id='pane-overview'] > :nth-child(1) > :nth-child(1) .amount", /42.50/);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

