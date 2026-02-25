/*
 * Test Name: 65013 Galileo - Hotel - Price breakdown matches the room level result price
 * Description: 
 * Status: Active
 * Labels: Galileo,Hotel,Regression,price,price breakdown,room level,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-08-01T10:01:48Z
 * Updated: 2025-09-16T01:24:28Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('galileogaliei@gdggalileo.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('London, UK');
  await Hotel___Click__View_rates__text_in_results_page();
  await Exract_total_price_room_level_results();
  await Click__Price_details__to_open_Price_Breakdown();
  await Extracting_prices();
  await Total_price_results_is_equal_to_total_price_breakdown();
  await Night_price_breakdown___Total_price_breakdown();
  await Night_price_breakdown___Total_price_breakdown_1();
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

async function Book_a_new_trip() {
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

async function Hotel___Click__View_rates__text_in_results_page() {
  await Hotel___Wait_for__View_rates__text_in_results_page();
  await page.click(".hotel-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".room-list > :nth-child(2) .btn--primary", 'Add to trip');
}

async function Exract_total_price_room_level_results() {
  await waitForText(page, ".room-list > :nth-child(2) .is-hidden-mobile", 'Price details');
  //TODO Please add an assertion here
await getText(page, ".room-list > :nth-child(2) .amount");
}

async function Click__Price_details__to_open_Price_Breakdown() {
  await waitForText(page, ".room-list > :nth-child(2) .is-hidden-mobile", 'Price details');
  await page.click(".room-list > :nth-child(2) .is-hidden-mobile");
  await page.click(".room-list > :nth-child(2) .is-hidden-mobile");
  await waitForText(page, "thead tr > :nth-child(1)", 'Sun');
}

async function Extracting_prices() {
  //TODO Please add an assertion here
await getText(page, "tbody tr > :nth-child(3)");
  //TODO Please add an assertion here
await getText(page, "body > :nth-child(28) .price-details > :nth-child(1) .amount");
  //TODO Please add an assertion here
await getText(page, "body > :nth-child(28) .price-details > :nth-child(7) .amount");
}

async function Verify_two_numbers_are_equal_with_tolerance() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, ""));
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = firstNumberParseFloat === secondNumberParseFloat;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
    
  });
}

async function Verify_two_numbers_are_equal(firstValue, secondValue) {
  await Verify_two_numbers_are_equal_with_tolerance();
}

async function Total_price_results_is_equal_to_total_price_breakdown() {
  await Verify_two_numbers_are_equal(totalPriceResults, totalPriceBreakdown);
}

async function Verify_two_numbers_are_equal_1() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, ""));
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = firstNumberParseFloat === secondNumberParseFloat;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
    
  });
}

async function Verify_two_numbers_are_equal_2(firstValue, secondValue) {
  await Verify_two_numbers_are_equal_1();
}

async function Night_price_breakdown___Total_price_breakdown() {
  await Verify_two_numbers_are_equal_2(nightPrice, totalPriceBreakdown);
}

async function Verify_two_numbers_are_equal_3() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, ""));
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = firstNumberParseFloat === secondNumberParseFloat;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
    
  });
}

async function Verify_two_numbers_are_equal_4(firstValue, secondValue) {
  await Verify_two_numbers_are_equal_3();
}

async function Night_price_breakdown___Total_price_breakdown_1() {
  await Verify_two_numbers_are_equal_4(subtotalPrice, totalPriceBreakdown);
}

