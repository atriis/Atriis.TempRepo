/*
 * Test Name: 29468 Manual quotes - Hotels
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2023-07-06T12:58:05Z
 * Updated: 2023-08-07T01:47:12Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('manualQuote@testim.com');
  await waitForText(page, ".marginEightee > div:nth-of-type(2) span", 'How would you like to start your next trip');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_Manual_Quote___Hotel();
  await Search_for_Hotels('Portland');
  await Add_Hotel_Info_and_Save_to_Cart();
  await Validate_price_in_cart_did_not_change();
  await Accept_and_proceed_to_checkout();
  await Book_and_Finalize();
  await Validate_price_after_checkout_did_not_change();
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

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Select_Manual_Quote___Hotel() {
  await page.click("#tab-manual > div");
  await waitForText(page, "h1", 'Add Manual Quote');
  await page.click("#tab-hotel > div");
}

async function Search_for_Hotels(Location) {
  await page.click("[placeholder='Search by hotel name, city name or landmark']");
  await page.type("[placeholder='Search by hotel name, city name or landmark']", Location);
  await page.click("[id='el-autocomplete-729-item-0'] .has-text-weight-bold");
  await page.click(".search-hotel-btn");
  await waitForText(page, ".is-capitalized", 'results');
}

async function Add_Hotel_Info_and_Save_to_Cart() {
  await page.click(".hotel-results > :nth-child(4) .btn");
  await page.click("[placeholder='City']");
  await page.type("[placeholder='City']", 'Portland');
  await page.click("[id='el-autocomplete-9118-item-0'] p");
  await page.click("[id='pane-hotel'] .manual-quote-form > :nth-child(3) > :nth-child(1) [type='text']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(1) span");
  await page.click("[id='pane-hotel'] [placeholder='Cancellation policy']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > li:nth-of-type(5) span");
  await page.click("[id='pane-hotel'] [placeholder='Confirmation Number']");
  await page.type("[id='pane-hotel'] [placeholder='Confirmation Number']", '456798456789');
  await page.click("[placeholder='Room description']");
  await page.type("[placeholder='Room description']", 'Standard');
  await scrollToElement(page, "[id='pane-hotel'] .price-section > :nth-child(1) [type='number']");
  await page.click("[id='pane-hotel'] .price-section > :nth-child(1) [type='number']");
  await page.type("[id='pane-hotel'] .price-section > :nth-child(1) [type='number']", '150');
  await page.click("[id='pane-hotel'] .price-section > :nth-child(3) [type='number']");
  await page.type("[id='pane-hotel'] .price-section > :nth-child(3) [type='number']", '20');
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Pending Booking');
}

async function Validate_price_in_cart_did_not_change() {
  await waitForText(page, ".page-layout-main .amount", '$170.00');
  await page.click(".ticket-top-section a > :nth-child(1)");
  await page.waitForSelector(".column", {state: "visible"});
  await waitForText(page, ".gray-section > :nth-child(1) .amount", '$150.00');
  await waitForText(page, ".gray-section > :nth-child(3) .amount", '$20.00');
  await page.click(".close-btn");
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

async function Book_and_Finalize() {
  await waitForText(page, ".no-reference-fields span", 'Yay! No additional details are required, you can now finalize your booking through the cart.');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
}

async function Validate_price_after_checkout_did_not_change() {
  await waitForText(page, ".page-layout-main .amount", '$170.00');
  await page.click(".page-view a > :nth-child(1)");
  await waitForText(page, ".gray-section > :nth-child(1) .amount", '$150.00');
  await waitForText(page, ".gray-section > :nth-child(3) .amount", '$20.00');
  await page.click(".btn--primary");
  await waitForText(page, ".page-view a > :nth-child(1)", 'More details');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

