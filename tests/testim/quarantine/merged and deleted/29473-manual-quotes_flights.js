/*
 * Test Name: 29473 Manual quotes - Flights
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2023-07-06T12:58:05Z
 * Updated: 2023-11-12T02:57:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('manualQuote@testim.com');
  await waitForText(page, ".marginEightee > :nth-child(2)", 'How would you like to start your next trip');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_Manual_Quote___Hotel();
  await Add_Flight_Info();
  await Validate_price_in_cart_did_not_change();
  await Proceed_to_Checkout();
  await Finalize_Booking();
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
  await page.click("#tab-flight > div");
}

async function Add_Carrier_Locator() {
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type(".manual-quote-flight-segment > :nth-child(5) > :nth-child(1) [type='text']", carrierLocator);
}

async function Add_Flight_Info() {
  await page.waitForSelector(".manual-quote-flight-segment", {state: "visible"});
  await page.click("[aria-activedescendant='el-autocomplete-3534-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-3534-item--1']", 'SFO');
  await page.click("[id='el-autocomplete-3534-item-0'] .has-text-weight-bold");
  await page.click("[aria-activedescendant='el-autocomplete-8012-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-8012-item--1']", 'LAX');
  await page.click("[x-placement='bottom-start'] .has-text-weight-bold");
  await page.click(".manual-quote-flight-segment > :nth-child(2) [readonly='readonly']");
  await page.dblclick("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(2) span");
  await page.click(".manual-quote-flight-segment > :nth-child(3) [readonly='readonly']");
  await page.click("[x-placement='top-start'] .el-date-table .current span");
  // Converting a 'drag' step has to be done manually at this time
  await page.type(".manual-quote-flight-segment > :nth-child(2) [placeholder='00:00']", '14:10');
  await page.click(".manual-quote-flight-segment > :nth-child(3) [placeholder='00:00']");
  // Converting a 'drag' step has to be done manually at this time
  await page.type(".manual-quote-flight-segment > :nth-child(3) [placeholder='00:00']", '16:12');
  await page.click(".manual-quote-flight-segment > :nth-child(4) > :nth-child(1) [type='text']");
  await page.type(".manual-quote-flight-segment > :nth-child(4) > :nth-child(1) [type='text']", '111');
  await page.click(".manual-quote-flight-segment > :nth-child(5) > :nth-child(1) [type='text']");
  await Add_Carrier_Locator();
  await page.click(".manual-quote-flight-segment > :nth-child(5) [placeholder='Select vendor']");
  await page.type(".is-focus [type='text']", 'del');
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(185) span");
  await page.click("[class^='mt'], [class*=' mt'] > :nth-child(1) [type='number']");
  await page.type("[class^='mt'], [class*=' mt'] > :nth-child(1) [type='number']", '80');
  await page.click("[class^='mt'], [class*=' mt'] > :nth-child(3) [type='number']");
  await page.type("[class^='mt'], [class*=' mt'] > :nth-child(3) [type='number']", '12');
  await page.click("[class^='ml'], [class*=' ml']");
}

async function Validate_price_in_cart_did_not_change() {
  await waitForText(page, ".page-layout-main .amount", '$92.00');
  await page.click(".more-details-btn");
  await waitForText(page, ".amounts > :nth-child(1) .amount", '$80.00');
  await waitForText(page, ".tax .amount", '$12.00');
  await page.click("#el-drawer__title > button > i");
}

async function Proceed_to_Checkout() {
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'On Hold');
  await page.click(".btn-container span");
}

async function Finalize_Booking() {
  await waitForText(page, "[class^='is-size'], [class*=' is-size']", 'Contact details');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Ticketing Complete');
}

async function Validate_price_after_checkout_did_not_change() {
  await waitForText(page, ".amount", '$92.00');
  await page.click(".more-details-btn");
  await waitForText(page, ".amounts > :nth-child(1) .amount", '$80.00');
  await waitForText(page, ".tax .amount", '$12.00');
  await page.click("#el-drawer__title > button > i");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

