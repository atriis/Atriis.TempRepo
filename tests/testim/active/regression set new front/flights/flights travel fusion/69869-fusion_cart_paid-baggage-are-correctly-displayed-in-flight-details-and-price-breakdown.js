/*
 * Test Name: 69869 Fusion - Cart - Paid baggage are correctly displayed in Flight Details and Price Breakdown
 * Description: 
 * Status: Active
 * Labels: Regression,Fusion,Flights,baggage,price breakdown,Flight Details,Cart,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-11-06T01:16:18Z
 * Updated: 2025-11-12T03:07:12Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('mikeshinoda@travelfusion.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('KWI', 'DEL');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Filter_by_any_option_in_results_page('No stops');
  await Add_flight_from_results_page_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Adding_paid_babbage();
  await Baggage_displayed_correctly_Flight_Details();
  await Baggage_is_displayed_correctly_Price_Breakdown();
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

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".search-btn");
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

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Adding_paid_babbage() {
  await waitForText(page, ".flight-baggage .card-title", 'Baggage');
  await page.click(".flight-baggage .is-clickable");
  await waitForText(page, "[id='pane-overview'] .el-tabs__nav", 'Mike Shinoda');
  await waitForText(page, "[id='pane-overview'] .btn--primary", 'Save');
  await waitForText(page, ".passenger-title .is-clickable", 'Edit');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] span");
  await waitForText(page, ".flight-cart-tabs span", new RegExp("\\b(?!0+(?:[.,]0{1,2})?\\b)\\d+(?:[.,]\\d{1,2})?\\s?(?:EUR|€)\\b"));
  //TODO Please add an assertion here
await getText(page, ".flight-cart-tabs span");
  await waitForText(page, "[id='pane-overview'] .btn--primary", 'Save');
  await page.click("[id='pane-overview'] .btn--primary");
  await Success_toast_alert();
}

async function Baggage_displayed_correctly_Flight_Details() {
  await waitForText(page, ".more-details-btn", 'Flight details');
  await page.click(".more-details-btn");
  await waitForText(page, ".segment-details-wrapper .flight-advisories > :nth-child(3) p", baggage);
}

async function tst() {
  await page.evaluate(() => {
    const eurToUsd = 1.08;      // Example conversion rate
    const tolerance = 0.05;     // Allow ±5 cents difference
    
    function verifyBaggagePrice(baggage, priceBreakdown) {
      // Extract the numeric value before EUR or €
      const match = baggage.match(/(\d+(?:[.,]\d{1,2})?)\s?(?:EUR|€)/i);
      if (!match) throw new Error(`No EUR price found in baggage: "${baggage}"`);
    
      const euro = parseFloat(match[1].replace(',', '.'));
      const usd = +(euro * eurToUsd).toFixed(2);
    
      // Check if difference is within tolerance
      if (Math.abs(usd - priceBreakdown) > tolerance) {
        throw new Error(
          `Price mismatch:\n  EUR: ${euro} → USD: ${usd}\n  Expected: ${priceBreakdown}\n  (tolerance ±${tolerance})`
        );
      }
    
      console.log(`Price verified: ${euro} EUR = ${usd} USD (within tolerance)`);
    }
    
  });
}

async function tst_1() {
  await tst();
}

async function Baggage_is_displayed_correctly_Price_Breakdown() {
  await page.click(".flight-quote-card > :nth-child(2)");
  await page.click(".price-breakdown-btn");
  await waitForText(page, ".amounts > :nth-child(3) > :nth-child(1)", 'Other');
  //TODO Please add an assertion here
await getText(page, ".amounts > :nth-child(3) .amount");
  await tst_1();
}

