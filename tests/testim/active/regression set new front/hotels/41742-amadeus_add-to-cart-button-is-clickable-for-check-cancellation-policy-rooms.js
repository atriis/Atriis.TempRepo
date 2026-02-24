/*
 * Test Name: 41742 Amadeus - "Add to cart" button is clickable for "check cancellation policy" rooms
 * Description: 
 * Status: Active
 * Labels: Amadeus,Hotel,Regression,cancellation policy,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-29T08:35:42Z
 * Updated: 2025-05-12T09:00:20Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('danielaoliveirauniglobe@testcorp.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('Ibis London Blackfriars');
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await Search_hotel_results_page('Ibis London Blackfriars');
  await add_hotel_in_case__check_cancellation_policy_();
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

async function Hotel___Wait_for__View_rates__text_in_results_page() {
  await waitForText(page, ".hotel-list > :nth-child(1) .extra-info a", 'View rates');
}

async function Search_hotel_results_page(name) {
  await waitForText(page, ".app-price-slider .filter-name", 'Price');
  await page.type("#el-id-3990-1048", name);
  await page.waitFor(1000);
}

async function Hotel___Click__View_rates_() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function if_refundable___add_the_hotel_to_cart() {
  if (await getText(page, ".refundable p") !== "'Refundable'") {
    return;
  }
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function exportIndex() {
  await page.evaluate(() => {
    if(TESTIM_ITERATOR == 0) {
        exportsTest.index = TESTIM_ITERATOR + 25
    }
    
    else {
        exportsTest.index = index + 3
    
    }
    
    const refundableElements = Array.from(document.querySelectorAll('.cancellation-terms-description'))
        .filter(element => element.textContent.includes('Refundable'));
  });
}

async function add_to_cart_in_case_refundable() {
  if (await getText(page, ".refundable p") !== "'Refundable'") {
    return;
  }
  await page.click(".room-list > :nth-child(2) .btn--primary");
  await page.waitFor(2000);
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function loop_for_each_room() {
  await page.click(".room-list > :nth-child(2) .no-padding");
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  await page.waitFor(500);
  await exportIndex();
  await page.click("body > :nth-child(1) .btn--text");
  await page.waitFor(1000);
  await add_to_cart_in_case_refundable();
  await scrollTo(page, 0, 962);
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function add_hotel_in_case__check_cancellation_policy_() {
  await Hotel___Click__View_rates_();
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollTo(page, 0, 462);
  await if_refundable___add_the_hotel_to_cart();
  await loop_for_each_room();
  await Pending_booking___wait_for_element_text();
}

