/*
 * Test Name: 54559 Evolvi seat reservation before and after checkout
 * Description: show offered seats in case user choose "specific seat" = any
 * Status: Active
 * Labels: No Amadeus Hotel Book,Full Purchase,Regression,Rail,Evolvi,progress page,Transportation,2026 plan 1
 * Owner: pini harush
 * Created: 2024-11-21T01:08:29Z
 * Updated: 2025-11-11T10:11:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("thiagosantos@evolvi.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Copy_of_UK_Rail__Evolvi__one_way_search_LON_to_LDS();
  await Close_mandatory_notification();
  await scrollToElement(page, "[aria-describedby='el-id-6786-287'] .amount");
  await page.click(".results > :nth-child(8) .price-row > div:nth-of-type(3) .amount");
  await page.click(".uk-rail-results .btn");
  await waitForText(page, ".quote-title", 'UK Rail To Leeds');
  await any_seat();
  await specific_seat();
  await page.click(".el-tabs .btn--primary");
  await page.waitFor(1000);
  await fill_Evolvi_RF();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await waitForText(page, "[class^='pl'], [class*=' pl'] > :nth-child(1)", 'More details');
  await page.click("[class^='pl'], [class*=' pl'] > :nth-child(1)");
  await waitForText(page, ".fs14", /Seat: Coach:/);
  await page.click("[aria-label='More details'] [fill='currentColor']");
  await Click_on_share_quote_from_the_cart();
  await waitForText(page, ".em_main_table [bgcolor='#ffffff'] .em_side_space > :nth-child(1) > :nth-child(1) > :nth-child(2) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(1) > :nth-child(1) [align='center'] > :nth-child(1) tbody > :nth-child(3) span", /Seat: Coach:/);
  await page.click(".show-close [xmlns='http://www.w3.org/2000/svg']");
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

async function Copy_of_UK_Rail__Evolvi__one_way_search_LON_to_LDS() {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", 'LON');
  await page.waitFor(1000);
  await page.click("[id='el-id-2019-156-item-0'] .autocomplete-result-text");
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", 'LDS');
  await page.waitFor(1000);
  await page.click("[id='el-id-3128-129'] .autocomplete-result-text");
  await page.click("#el-id-5111-211");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function Close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Verify_two_numbers_are_equal() {
  await page.evaluate(() => {
    let firstNumberParseFloat = parseFloat(String(firstValue).replace(/,/g, "")); 
    let secondNumberParseFloat = parseFloat(String(secondValue).replace(/,/g, ""));
    
    const equal = Math.abs(firstNumberParseFloat - secondNumberParseFloat) <= tolerance;
    
    if (!equal) {
        throw new Error(`Values are different, first value is ${firstNumberParseFloat} and second value is ${secondNumberParseFloat}`);
    } else {
        console.log("Values are equal");
    }
  });
}

async function Verify_two_numbers_are_equal_1(firstValue, secondValue, tolerance) {
  await Verify_two_numbers_are_equal();
}

async function any_seat() {
  await page.click(".uk-rail-seats .is-clickable");
  await waitForText(page, ".segment-container .is-flex > :nth-child(1) span", 'Any');
  await page.click(".el-tabs .btn--primary");
  await page.waitFor(5000);
  await page.click(".uk-rail-seats .is-clickable");
  await waitForText(page, ".is-focus .el-radio__label", 'Specific Seat');
  await page.click(".el-radio-group > :nth-child(2) .el-radio__inner");
  //TODO Please add an assertion here
await getText(page, ".columns > :nth-child(2) span");
  //TODO Please add an assertion here
await getText(page, "[class^='px'], [class*=' px'] [class^='p'], [class*=' p'] > :nth-child(2)");
  await Verify_two_numbers_are_equal_1(seat1, suppseat1, 0.09);
  await waitForText(page, "[class^='px'], [class*=' px'] [class^='p'], [class*=' p'] > :nth-child(2)", /Reserved Seat:/);
}

async function specific_seat() {
  await waitForText(page, ".el-radio-group > :nth-child(2) .el-radio__label", 'Specific Seat');
  await page.click(".el-radio-group > :nth-child(2) .el-radio__inner");
  await page.click(".el-tabs .btn--primary");
  await page.waitFor(5000);
  await page.click(".uk-rail-seats .is-clickable");
  await waitForText(page, ".el-radio-group > :nth-child(2) .el-radio__label", 'Specific Seat');
  await page.click(".el-radio-group > :nth-child(2) .el-radio__inner");
  //TODO Please add an assertion here
await getText(page, ".columns > :nth-child(2) span");
  //TODO Please add an assertion here
await getText(page, "[class^='px'], [class*=' px'] [class^='p'], [class*=' p'] > :nth-child(2)");
  await Verify_two_numbers_are_equal_1(seat, seatFromSupp, 0.99);
  //TODO Please add an assertion here
await getText(page, ".columns > :nth-child(1) span");
  await waitForText(page, "[class^='px'], [class*=' px'] [class^='p'], [class*=' p'] > :nth-child(2)", new RegExp("Coach: "+coach1));
}

async function fill_Evolvi_RF() {
  await page.click(".uk-rail-delivery-method .is-clickable");
  await waitForText(page, ".el-radio-group > :nth-child(2) .delivery-option > div:nth-of-type(1) span", 'Atriis - TIcket on Departure (Collect at Station)');
  await page.click(".el-radio-group > :nth-child(3) .el-radio__inner");
  await page.click(".el-tabs .btn--primary");
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await page.click(".el-select__placeholder");
  await page.click("#el-id-3155-2795 > span");
  await page.click(".el-tabs .btn--primary");
  await page.click(".uk-rail-client-reference .is-clickable");
  await page.type("#el-id-3155-2800", '1234');
  await page.type("#el-id-3155-2802", '2345');
  await page.type("#el-id-3155-2803", '3456');
  await page.type("#el-id-3155-2804", 'yes');
  await page.type("#el-id-5649-2893", 'temp');
  await page.click(".tabs-container .btn--primary");
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

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Click_on_share_quote_from_the_cart() {
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-8844 > li:nth-child(1)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

