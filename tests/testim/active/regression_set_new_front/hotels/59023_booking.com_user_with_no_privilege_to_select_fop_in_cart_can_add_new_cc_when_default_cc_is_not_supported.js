/*
 * Test Name: 59023 Booking.com - User with no privilege to select FOP in cart can add new cc when default cc is not supported
 * Description: 
 * Status: Active
 * Labels: Booking.com,booking.com 3.1,FOP,Regression,credit card,Cart,Privileges,Hotel,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-21T09:13:02Z
 * Updated: 2025-05-12T07:53:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('discover@booking.club');
  await book_a_new_trip();
  await Search_hotel_1_night('The White Swan, The Green, Scotter, Gainsborough, UK');
  await add_hotel_from_search_results_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Adding_a_new_cc_when_default_cc_is_not_supported();
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

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_refundable_hotel() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    let refundableRoom=document.querySelector(".refundable.cancellation-terms");
    refundableRoom.parentElement.parentElement.parentElement.parentElement.children[1].firstChild.firstChild.firstChild.children[2].click()
  });
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
  await Pending_Booking___Wait_for_element_text();
  await waitForText(page, ".ticket-top-section p", 'Refundable');
}

async function Credit_Guard_modal_insert_cc_number(ccNumber) {
  await page.click("[placeholder='Please enter your credit card number']");
  await page.type("[placeholder='Please enter your credit card number']", ccNumber);
  await page.waitFor(500);
  await page.click("body > :nth-child(14) .btn--primary");
}

async function Add_credit_card() {
  await page.click(".add-credit");
  await page.click(".form-inputs > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4685-522 > div > div:nth-child(1) > span");
  await page.type("[placeholder='Card holder name']", 'Sunny Atriis');
  await page.click(".form-inputs > :nth-child(5) > :nth-child(1) .el-select__caret");
  await page.click("#el-id-2829-778");
  await page.click(".form-inputs > :nth-child(5) > :nth-child(2) .el-select__caret");
  await page.click("#el-id-2829-1079 > span");
  await page.click(".is-transparent span");
  await page.type("#el-id-2829-1375", 'israel');
  await page.click("#el-id-2829-1492 > span");
  await page.type("[placeholder='City name']", 'Tel Aviv Yafo');
  await page.type("[placeholder='Zip code']", '6654115');
  await page.type("[placeholder='Street name']", 'Yigal Alon 30');
  await page.click(".insertCard");
  await Credit_Guard_modal_insert_cc_number(4580458045804580);
  await page.waitFor(1000);
  await page.click(".btn-save");
  await waitForText(page, ".successfully-saved", /Payment added successfully/);
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function Adding_a_new_cc_when_default_cc_is_not_supported() {
  await page.click(".add-form-payment");
  await waitForText(page, "#el-id-2428-250 > section > div.form-inputs > p", 'Select payment method');
  await waitForText(page, ".card-name > :nth-child(1)", 'Travel-Hotels (not supported)');
  await waitForText(page, ".is-3", 'Not supported');
  await page.click(".checkbox-round");
  await page.click(".btn-save");
  await page.waitFor(3000);
  //TODO Please add an assertion here
await isVisible(page, "#el-id-7635-251");
  await Add_credit_card();
  //TODO Please add an assertion here
await isVisible(page, ".payment-status-icon");
}

