/*
 * Test Name: 57320 Amadeus - Ryanair - Price is correct after adding baggage
 * Description: 
 * Status: Active
 * Labels: Amadeus,Flights,Ryanair,Regression,baggage,price,Cart,GDS,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-01-14T06:56:52Z
 * Updated: 2026-02-16T10:28:35Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunasantosnl@testim.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way___thursday('BUD', 'DUB');
  await click_on_proceed_after_search();
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Filter_by_any_option_in_results_page('Ryanair');
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await page.click(".flight-baggage .is-clickable");
  await waitForText(page, ".rout", /BUD/);
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-9771-563");
  await page.click(".tabs-container .btn--primary");
  await Pending_booking___wait_for_element_text();
  //TODO Please add an assertion here
await getText(page, ".price-summary .amount");
  await Check_if_price_before_and_after_adding_baggage_makes_sense(beforeBaggage, afterBaggage);
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

async function Search_flights_one_way___thursday(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await page.click("#el-id-438-29-item-0 > div");
  await page.type("[placeholder='To... Destination']", to);
  await page.click("#el-id-438-32-item-0 > div");
  await page.click("#el-id-6573-314");
  await page.click("[id='el-id-6573-300'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.dblclick("[id='el-id-6573-300'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-6573-300'] tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
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

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Check_if_price_before_and_after_adding_baggage_makes_sense(firstValue, secondValue) {
  await page.evaluate((firstValue, secondValue) => {
    const difference = Math.abs(firstValue - secondValue);
    
    if (difference < 150) {
        console.log("Price makes sense after adding baggage.");
        console.log("First value:", firstValue, "Second value:", secondValue);
    } else {
        throw new Error(`Price difference is too large. First value: ${firstValue}, Second value: ${secondValue}`);
    }
    
  }, firstValue, secondValue);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

