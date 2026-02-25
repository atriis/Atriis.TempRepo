/*
 * Test Name: 29413 Amtrak > Fare rules are loading in results, cart, and checkout
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2023-06-15T03:04:44Z
 * Updated: 2025-07-16T03:57:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('amtrak@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_Amtrak_round_trip('NYP', 'WAS');
  await Select_and_add_to_trip();
  await check_fare_rules__Cart_();
  await Complete_required_fields_and_checkout();
  await Book_and_Finalize();
  await Check_fare_rules_in_cart();
  await Cancel_Amtrak_with_refund();
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

async function Search_Amtrak_round_trip(fromStation, toStation) {
  await page.click(".el-tabs__header .el-input");
  await page.click("#el-id-3445-21");
  await page.type("[placeholder='From... Station or Location']", fromStation);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.type("[placeholder='To... Station or Location']", toStation);
  await page.click("[id='el-id-4566-49-item-0'] p");
  await page.click("#el-id-1388-375");
  await page.click("[id='el-id-1388-296'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-1388-296'] tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1388-379");
  await page.click("[id='el-id-1388-331'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".is-paddingless .control");
  await page.click(".search-btn");
}

async function Select_and_add_to_trip() {
  await waitForText(page, "[class^='mr'], [class*=' mr']", 'Sort by');
  await page.click(".amtrak-list > :nth-child(3) .no-padding");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare Rules for NYP To WAS');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) section > :nth-child(1) > :nth-child(1) div");
  await page.click("body > :nth-child(14) .el-dialog__close");
  if (false) {
    await scrollToElement(page, ".amtrak-list > :nth-child(8) .select-rail-btn");
  }
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await page.waitFor(500);
  await page.click(".amtrak-list > :nth-child(1) .no-padding");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare Rules for WAS To NYP');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) section > :nth-child(1) > :nth-child(1) div");
  await page.click("body > :nth-child(15) .el-dialog__close");
  await scrollToElement(page, ".amtrak-list > :nth-child(6) .select-rail-btn");
  await page.click(".amtrak-list > :nth-child(6) .select-rail-btn");
  await page.click(".add-btn");
  await page.waitForSelector(".btn--primary", {state: "visible"});
}

async function check_fare_rules__Cart_() {
  await page.click(".amtrak-details > :nth-child(1) .btn");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare rules');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) section > :nth-child(1) > :nth-child(1) div");
  await page.click("body > :nth-child(14) .el-dialog__close");
  await page.click(".amtrak-details > :nth-child(2) [class^='p'], [class*=' p']");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare rules');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) section > :nth-child(1) > :nth-child(1) div");
  await page.click("body > :nth-child(14) .el-dialog__close");
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

async function accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Complete_required_fields_and_checkout() {
  await page.click(".amtrak-contact-information .is-clickable");
  await page.click("[type='text']");
  await page.click(".el-scrollbar__view > li:nth-of-type(3) span");
  await page.click("[maxlength='3']");
  await page.type("[maxlength='3']", '1');
  await page.click(".control > div:nth-of-type(2) [type='number']");
  await page.type(".control > div:nth-of-type(2) [type='number']", '310');
  await page.click(".control > div:nth-of-type(3) [type='number']");
  await page.type(".control > div:nth-of-type(3) [type='number']", '3338888');
  await page.click("[id='pane-overview'] .no-border");
  await page.waitForSelector(".success-icon", {state: "visible"});
  await accept_and_proceed_to_checkout();
}

async function Book_and_Finalize() {
  await waitForText(page, ".no-reference-fields span", 'Yay! No additional details are required, you can now finalize your booking through the cart.');
  await page.waitFor(1000);
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__title", 'Success');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
}

async function Check_fare_rules_in_cart() {
  await page.click(".amtrak-details > :nth-child(1) .btn");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare rules');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) section > :nth-child(1) > :nth-child(1) div");
  await page.click("body > :nth-child(14) .el-dialog__close");
  await page.click(".amtrak-details > :nth-child(2) [class^='p'], [class*=' p']");
  await waitForText(page, "body > :nth-child(14) .el-dialog__title", 'Fare rules');
  //TODO Please add an assertion here
await isVisible(page, "body > :nth-child(14) section > :nth-child(1) > :nth-child(1) div");
  await page.click("body > :nth-child(14) .el-dialog__close");
}

async function Cancel_Amtrak_with_refund() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#dropdown-menu-4040 > li:nth-child(2)");
  await waitForText(page, ".refund-msg", 'How would you like to be refunded');
  await waitForText(page, "[aria-checked='true'] .el-radio__label", /^Refund by Credit card/);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-title", 'Cancelation confirmed!');
}

