/*
 * Test Name: 29471 Manual quotes - Ground Transport
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2023-07-06T12:58:05Z
 * Updated: 2024-01-15T05:41:40Z
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
  await Select_Manual_Quote___Car();
  await Enter_Reservation_Info_and_Add_to_Cart();
  await waitForText(page, ".page-layout-main .amount", '$74.00');
  await Complete_Checkout();
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
  await waitForText(page, ".amount", '$74.00');
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

async function Select_Manual_Quote___Car() {
  await page.click("#tab-manual > div");
  await waitForText(page, "h1", 'Add Manual Quote');
  await page.click("#tab-groundService > div");
}

async function Enter_Reservation_Info_and_Add_to_Cart() {
  await page.click("[aria-activedescendant='el-autocomplete-6645-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-6645-item--1']", 'LCY');
  await page.click("[id='el-autocomplete-6645-item-0'] p");
  await page.click("[aria-activedescendant='el-autocomplete-2038-item--1']");
  await page.type("[aria-activedescendant='el-autocomplete-2038-item--1']", 'Wembley');
  await page.click("[id='el-autocomplete-2038-item-0'] p");
  await page.click("[placeholder='Pick-up date']");
  await page.click("[placeholder='Pick-up date']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(5) span");
  await page.click("[placeholder='Pick-up time']");
  await page.type("[placeholder='Pick-up time']", '18:45');
  await sendSpecialCharacter(page, "[placeholder='Pick-up time']", 'Enter');
  await page.click(".vendor-select .el-input");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > :nth-child(15)");
  await page.click(".manual-select [type='text']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click(".other-products-form > :nth-child(4) > :nth-child(1) [type='text']");
  await page.type(".other-products-form > :nth-child(4) > :nth-child(1) [type='text']", '24 Hours prior to pick up');
  await page.click(".other-products-form > :nth-child(4) > :nth-child(2) [type='text']");
  await page.type(".other-products-form > :nth-child(4) > :nth-child(2) [type='text']", 'ASD456789');
  await page.dblclick("[id='pane-groundService'] .price-section > :nth-child(1) [type='number']");
  await page.type("[id='pane-groundService'] .price-section > :nth-child(1) [type='number']", '56');
  await sendSpecialCharacter(page, "[id='pane-groundService'] .price-section > :nth-child(1) [type='number']", 'Tab');
  await page.type("[id='pane-groundService'] .price-section > :nth-child(3) [type='number']", '18');
  await page.click("[class^='ml'], [class*=' ml']");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'On Hold');
}

async function Complete_Checkout() {
  await page.click(".btn-container span");
  await waitForText(page, ".no-reference-fields span", 'Yay! No additional details are required, you can now finalize your booking through the cart.');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

