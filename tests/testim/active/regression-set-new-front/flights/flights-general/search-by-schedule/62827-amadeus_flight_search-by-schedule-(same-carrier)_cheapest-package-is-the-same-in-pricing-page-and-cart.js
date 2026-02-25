/*
 * Test Name: 62827 Amadeus - Flight - Search by schedule (same carrier) - "Cheapest package" is the same in pricing page and cart
 * Description: 
 * Status: Active
 * Labels: Regression,Flights,by schedule,price,Amadeus,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-05-29T08:23:01Z
 * Updated: 2025-09-01T03:07:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('coreytaylor@amadeusclubdubu.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flight_round_trip_by_schedule('DUB', 'PRG');
  await Adding__Cheapest_package__same_carrier_to_cart();
  await My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart_1();
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

async function Search_flight_round_trip_by_schedule(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-3808-86", 'Tab');
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-3808-87", 'Tab');
  await page.click("[placeholder='Depart Date']");
  await page.click("[id*='id'] .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.waitFor(1000);
  await page.click("[id='el-id-520-77'] > :nth-child(2) .el-radio__label");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Select__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Select');
}

async function test() {
  await page.evaluate(() => {
    const xpath = `//label[.//p[text()='${option}']]//span[contains(@class, 'el-checkbox__input')]`;
    
    const element = document.evaluate(
      xpath,
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    if (element) {
      element.click();
    } else {
      console.error(`Checkbox for '${option}' not found.`);
    }
    
  });
}

async function Filter_by_any_option_in_results_page(option) {
  await page.click(".carriers-filter .material-symbols-outlined");
  await test();
}

async function Filter_by_any_option_in_results_page_1() {
  await page.evaluate(() => {
    const xpath = `//label[.//p[text()='${option}']]//span[contains(@class, 'el-checkbox__input')]`;
    
    const element = document.evaluate(
      xpath,
      document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
    ).singleNodeValue;
    
    if (element) {
      element.click();
    } else {
      console.error(`Checkbox for '${option}' not found.`);
    }
    
  });
}

async function Filter_by_any_option_in_results_page_2(option) {
  await Filter_by_any_option_in_results_page_1();
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Adding__Cheapest_package__same_carrier_to_cart() {
  await Flight___Results___Wait_for__Select__text();
  await Filter_by_any_option_in_results_page('Lufthansa');
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await waitForText(page, ".change-flight-btn", 'Change flight');
  await waitForText(page, ".carriers-filter h4", 'Preferred airlines');
  await Flight___Results___Wait_for__Select__text();
  await Filter_by_any_option_in_results_page_2('Lufthansa');
  await waitForText(page, ".flight-list > :nth-child(1) .carrier-container div > :nth-child(2)", /LH/);
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await page.waitForSelector(".flights-by-schedule-selected-segments .title", {state: "visible"});
  await waitForText(page, ".pricing-options-container > :nth-child(1) .btn--primary", 'Add to trip');
  await waitForText(page, "[class^='ml'], [class*=' ml'] .title", 'Cheapest package');
  //TODO Please add an assertion here
await getText(page, "[class^='ml'], [class*=' ml'] [class^='mr'], [class*=' mr'] > div:nth-of-type(1) .amount");
  await page.click("[class^='ml'], [class*=' ml'] .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
}

async function My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart() {
  await page.evaluate(() => {
    const tolerance = 0.30; // tolerance constant for floating-point comparison
    
    const cheapestParseFloat = parseFloat(cheapest);
    const priceCartParseFloat = parseFloat(priceCart);
    
    if (Math.abs(cheapestParseFloat - priceCartParseFloat) > tolerance) {
      throw new Error(`Values are not equal within tolerance. cheapest: ${cheapestParseFloat}, priceCart: ${priceCartParseFloat}, tolerance: ${tolerance}`);
    }
    
  });
}

async function My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart_1() {
  await My_Selection___Validating_if_the_prices_are_matching_from_search_until_cart();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

