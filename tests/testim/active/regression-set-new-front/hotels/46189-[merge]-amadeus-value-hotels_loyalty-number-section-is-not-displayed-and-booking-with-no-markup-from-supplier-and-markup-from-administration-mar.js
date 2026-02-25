/*
 * Test Name: 46189 [Merge] Amadeus Value Hotels - "Loyalty number" section is not displayed and booking with no markup from supplier and markup from administration, markup up displayed in room list
 * Description: 
 * Status: Active
 * Labels: Amadeus Value hotel,Regression,Hotel,Clube Viajar,merge,Extras,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-05-16T03:43:35Z
 * Updated: 2025-01-27T12:38:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('amadeusVH@clube.com');
  await Hotel___click_hotel_icon();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel__extract_hotel_rate_from_results();
  await View_room_list_and_validate_rate_includes_markup();
  await Add_refundable_room_to_cart();
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

async function Hotel___click_hotel_icon() {
  await page.click(".product-carousel > :nth-child(2) > :nth-child(2) .icon-text");
  await page.waitForSelector("#pane-hotel > h4", {state: "visible"});
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

async function Search_hotel__extract_hotel_rate_from_results() {
  await Search_hotel_1_night('Berlin');
  await waitForText(page, ".hotel-list-sort .actions .is-size-6", /Showing/);
  //TODO Please add an assertion here
await getText(page, ".hotel-list > :nth-child(2) .amount");
}

async function View_room_list_and_validate_rate_includes_markup() {
  await page.click(".hotel-list > :nth-child(2) .see-availability-btn");
  await waitForText(page, "#tab-overview", 'Overview');
  await scrollTo(page, 0, 599);
  //TODO Please add an assertion here
await getText(page, ".room-list > :nth-child(2) .amount");
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "'      Proceed    '") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function List_length___latest_version(length, locator) {
  await page.evaluate((length, locator) => {
    const expectedLength = Number(length); // Replace 'length' with the expected number of visible elements
    
    // Convert NodeList to an array, ensure exact matches, and filter for visible elements
    const elements = Array.from(document.querySelectorAll(locator))
      .filter(el => el.matches(locator)) // Ensure the element exactly matches the locator
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); // Robust visibility check
    
    // Validate the number of visible and exact match elements
    if (elements.length === expectedLength) {
      console.log(`The element appears ${elements.length} times and is visible.`);
    } else {
      throw new Error(`Assertion failed: Expected ${expectedLength} visible elements, but found ${elements.length}.`);
    }
    
  }, length, locator);
}

async function not_visible() {
  await waitForText(page, ".quote-extras p", 'Special request');
  await List_length___latest_version('1', '.quote-extras');
}

async function Price_change_message() {
  if (!(await isVisible(page, ".book-error-warning > :nth-child(1)"))) {
    return;
  }
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function Add_refundable_room_to_cart() {
  await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  await page.click(".room-list > :nth-child(2) .add-btn");
  await Copy_of_click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".tabs-container .price-wrapper > :nth-child(1)", 'To pay');
  await not_visible();
  await scrollToElement(page, ".el-checkbox__inner");
  await page.click(".el-checkbox__inner");
  await page.click(".btn-container span");
  await Price_change_message();
  await waitForText(page, ".dates-and-rooms", '1                Night,                1                Room');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, "[class^='ml'], [class*=' ml']", 'Confirmed');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

