/*
 * Test Name: 29469 Manual quotes - Cars
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2023-07-06T12:58:05Z
 * Updated: 2023-08-20T01:06:19Z
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
  await Add_Reservation_Info();
  await Validate_price_in_cart_did_not_change();
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
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
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
  await page.click("#tab-car > div");
}

async function Add_Reservation_Info() {
  await page.click("[aria-activedescendant='el-autocomplete-2410-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2410-item--1']", 'Portland');
  await page.click("[id='el-autocomplete-2410-item-1'] .has-text-weight-bold");
  await page.click("[aria-activedescendant='el-autocomplete-799-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-799-item--1']", 'Portland');
  await page.click("[id='el-autocomplete-799-item-0'] .has-text-weight-bold");
  await page.click("[id='pane-car'] .manual-quote-form > :nth-child(1) [readonly='readonly']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(1) span");
  await page.click("[id='pane-car'] .manual-quote-form > :nth-child(1) [placeholder='00:00']");
  await page.type("[id='pane-car'] .manual-quote-form > :nth-child(1) [placeholder='00:00']", '15:00');
  await sendSpecialCharacter(page, "[id='pane-car'] .manual-quote-form > :nth-child(1) [placeholder='00:00']", 'Enter');
  await page.click("[id='pane-car'] .manual-quote-form > :nth-child(2) [placeholder='00:00']");
  await page.type("[id='pane-car'] .manual-quote-form > :nth-child(2) [placeholder='00:00']", '15:00');
  await sendSpecialCharacter(page, "[id='pane-car'] .manual-quote-form > :nth-child(2) [placeholder='00:00']", 'Enter');
  await page.click("[placeholder='2/4 Doors']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("[placeholder='Manual']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[placeholder='Mini Elite']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("[placeholder='No']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("[id='pane-car'] [placeholder='Select vendor']");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > :nth-child(5)");
  await page.click("[id='pane-car'] [placeholder='Cancellation policy']");
  await page.type("[id='pane-car'] [placeholder='Cancellation policy']", 'No Fee');
  await page.click("[id='pane-car'] [placeholder='Confirmation Number']");
  await page.type("[id='pane-car'] [placeholder='Confirmation Number']", 'AB123C456');
  await page.click("[id='pane-car'] [role='radiogroup'] > :nth-child(1) .el-radio__inner");
  await page.click("[id='pane-car'] .price-section > :nth-child(1) [type='number']");
  await page.type("[id='pane-car'] .price-section > :nth-child(1) [type='number']", '24');
  await page.click("[id='pane-car'] .price-section > :nth-child(3) [type='number']");
  await page.type("[id='pane-car'] .price-section > :nth-child(3) [type='number']", '07');
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'On Hold');
}

async function Validate_price_in_cart_did_not_change() {
  await waitForText(page, ".page-layout-main .amount", '$31.00');
  await page.click(".more-details .is-flex");
  await waitForText(page, ".el-drawer__body > :nth-child(4) .price-summary > :nth-child(1) > :nth-child(2)", '$24.00');
  await waitForText(page, ".el-drawer__body > :nth-child(4) .price-summary > :nth-child(2) > :nth-child(2)", '$7.00');
  await page.click("#el-drawer__title > button > i");
}

async function Book_and_Finalize() {
  await page.click(".btn-container span");
  await waitForText(page, ".no-reference-fields span", 'Yay! No additional details are required, you can now finalize your booking through the cart.');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
}

async function Validate_price_after_checkout_did_not_change() {
  await waitForText(page, ".amount", '$31.00');
  await page.click(".more-details .is-flex");
  await waitForText(page, ".el-drawer__body > :nth-child(4) .price-summary > :nth-child(1) > :nth-child(2)", '$24.00');
  await waitForText(page, ".el-drawer__body > :nth-child(4) .price-summary > :nth-child(2) > :nth-child(2)", '$7.00');
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

