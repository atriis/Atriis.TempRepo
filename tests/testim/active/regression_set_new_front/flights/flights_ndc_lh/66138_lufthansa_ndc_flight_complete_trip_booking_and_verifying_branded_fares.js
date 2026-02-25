/*
 * Test Name: 66138 Lufthansa NDC - Flight - Complete Trip booking and verifying Branded Fares
 * Description: 
 * Status: Active
 * Labels: Flights,Branded fares,Full Purchase,NDC,Lufthansa NDC Regression,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-08-29T05:47:34Z
 * Updated: 2025-09-30T02:38:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("claraaguiar@ndclhclara.com");
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('FRA', 'MIA');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Filter_by_any_option_in_results_page('Lufthansa');
  await Check_flight_branded_fares___flight_details__results_page_();
  await Check_flight_branded_fares___pricing_options__results_page_();
  await Add_to_trip_first_flight();
  await Flight___Branded_Fares____Flight_details__cart_page();
  await Accept__Terms___Conditions_();
  await Hold_flight();
  await Flight___Branded_Fares____Flight_details__cart_page();
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
  await page.click(".trip-search-control");
}

async function Search_flights_round_trip(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  if (false) {
    await page.click(".ellipsis");
  }
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await old_date_picker();
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

async function Flight___Click__Flight_details_() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
}

async function Check_flight_branded_fares___flight_details__results_page_() {
  await Flight___Click__Flight_details_();
  await page.click(".flight-details > :nth-child(1) > :nth-child(2) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[aria-label='Flight details'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
}

async function Check_flight_branded_fares___pricing_options__results_page_() {
  await page.click(".flight-list > :nth-child(1) .pricing-options");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.click(".segment-preview .btn");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".segment-preview .btn");
  await waitForText(page, ".segment-preview .btn", 'Flight details');
  await page.click(".pricing-options-section > :nth-child(1) .brand-name");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitFor(2500);
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip_first_flight() {
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".flight-list > :nth-child(1) .is-hidden-mobile");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await Pending_booking___wait_for_element_text();
}

async function Flight___Branded_Fares____Flight_details__cart_page() {
  await waitForText(page, ".more-details-btn", 'Flight details');
  await page.click(".more-details-btn");
  await waitForText(page, ".flight-details > :nth-child(1) > :nth-child(3) .flight-leg-details > :nth-child(1) .flight-time-date", /2/);
  await page.click(".flight-details > :nth-child(1) > :nth-child(3) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".flight-quote-card > :nth-child(4)");
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Price_Change() {
  if (await getText(page, ".muliBold") !== "'Price change'") {
    return;
  }
  await page.click(".app-footer .is-flex-wrap-wrap .btn--primary");
}

async function On() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Hold_flight() {
  await page.click(".quote-card .btn--default");
  await Price_Change();
  await On();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

