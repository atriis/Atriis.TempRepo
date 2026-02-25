/*
 * Test Name: 18420 Expedia Member Rates - Price with discount is lower than total price
 * Description: 
 * Status: Active
 * Labels: Expedia,Regression,Hotel,price,Check price,Daily Hotels,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-12-31T06:37:59Z
 * Updated: 2025-10-22T04:02:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('expedia@only.corp');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('Verona,Italy,(VRN)');
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await Verify_hotel_has_member_rates_in_hotel_level();
  await Hotel___Click__View_rates__text_in_results_page();
  await Verify_hotel_has_member_rates_in_room_level();
  await Extract_price_with_and_without_discont();
  await Comparing_2_values_to_see_if_one_is_bigger(priceBeforeDiscount, priceAfterDiscount);
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

async function Verify_hotel_has_member_rates_in_hotel_level() {
  await waitForText(page, ".badge-wrapper > :nth-child(1) .text > :nth-child(2)", 'Member rates Available');
}

async function Hotel___Click__View_rates__text_in_results_page() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function Verify_hotel_has_member_rates_in_room_level() {
  await waitForText(page, ".room-list > :nth-child(2) .room-details > :nth-child(4) > div:nth-of-type(2) .text", 'Member rate');
}

async function Extract_price_with_and_without_discont() {
  //TODO Please add an assertion here
await isVisible(page, ".room-list > :nth-child(2) .amount-before-discount");
  //TODO Please add an assertion here
await getText(page, ".room-list > :nth-child(2) .amount-before-discount");
  await waitForText(page, ".room-list > :nth-child(2) .amount", new RegExp("\\."));
  //TODO Please add an assertion here
await getText(page, ".room-list > :nth-child(2) .amount");
}

async function Copy_of_Comparing_2_values_to_see_if_one_is_bigger() {
  await page.evaluate(() => {
    const largestParseFloat = parseFloat(String(largestNumber).replace(/,/g, ""));
    const smallestParseFloat = parseFloat(String(smallestNumber).replace(/,/g, ""));
    
    if (smallestParseFloat >= largestParseFloat) {
        throw new Error(`Error: smallest number (${smallestParseFloat}) should be less than largest number (${largestParseFloat}).`);
    } else {
        console.log("Smallest number is less than largest number — all good!");
    }
    
  });
}

async function Comparing_2_values_to_see_if_one_is_bigger(largestNumber, smallestNumber) {
  await Copy_of_Comparing_2_values_to_see_if_one_is_bigger();
}

