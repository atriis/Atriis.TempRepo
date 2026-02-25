/*
 * Test Name: API- Booking Car Amadeus and check remarks
 * Description: Booking Car Amadeus
 * Status: Evaluating
 * Labels: price offer,Cars
 * Owner: pini harush
 * Created: 2022-12-13T01:29:17Z
 * Updated: 2025-10-07T06:00:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await LOG_IN('avi@zini.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await search_car_by_place('LHR');
  await push_notification();
  await add_car_from_results_page_to_cart();
  await waitForText(page, ".payments-title", 'Trip overview');
  await accept_and_proceed_to_checkout();
  await waitForText(page, "#el-collapse-head-2066 > div > span", 'Travellers Reference Questions');
  await scrollTo(page, 0, 97);
  await scrollToElement(page, "[name='Default field 4']");
  await page.click(".is-focused .el-select__placeholder span");
  await page.click("#el-id-2576-1167 > span");
  await page.click(".traveler-questions > :nth-child(6) [type='text']");
  await page.type(".traveler-questions > :nth-child(6) [type='text']", '123456');
  await page.click(".traveler-questions > :nth-child(7) [type='text']");
  await page.type(".traveler-questions > :nth-child(7) [type='text']", 'aa223');
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__title", 'Success');
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".app-label", 'Confirmed');
  await Remarks_validation_by_API__exact_input_validation_("ACTIVE ON CORP AND TMC-FLIGHT-AFTER BOOKING-GDS", , 'avi@zini.com', true, 5);
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
async function LOG_IN(username) {
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function old() {
  if (true) {
    return;
  }
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  if (false) {
    await page.click("[placeholder='Pick-up Date']");
  }
  if (false) {
    await page.click("[aria-label='Next Month']");
  }
  if (false) {
    await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(2) span");
  }
  await page.click("#el-id-9250-87");
  await page.click("[id='el-id-3812-54'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-993-38 > span");
  await page.waitFor(1000);
  await page.click("[id='el-id-9786-26'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  if (false) {
    await page.click("#el-id-8716-55 > span");
  }
  await page.click("#el-id-7049-91 > span");
  await page.click("[id='el-id-2044-100'] .btn-apply");
  if (false) {
    await page.click("[placeholder='Drop-off Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(6) > td:nth-of-type(3) span");
  }
  await page.click("#el-id-9250-122");
  await page.waitFor(1000);
  await page.click("[id='el-id-9250-123'] [class^='mr'], [class*=' mr'] .el-select__wrapper");
  await page.click("#el-id-9198-139 > span");
  await page.click("[id='el-id-9198-123'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-8989-90 > span");
  await page.click("[id='el-id-9151-135'] .btn-apply");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
  await page.click(".search-btn");
}

async function search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click(".search-btn");
  await old2();
  await old();
}

async function push_notification() {
  if (await getText(page, "body > :nth-child(11) .el-dialog__title") !== "'Mandatory Notifications'") {
    return;
  }
  await page.click(".el-checkbox__inner");
  await page.click("body > :nth-child(11) .btn");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
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

async function accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function getTripId() {
  await page.evaluate(() => {
    const url = window.location.href;
    const match = url.match(/trips\/(\d+)\//);
    
    if (!match) {
      throw new Error("Trip number not found in URL: " + url);
    }
    
    var tripNumber = match[1];
    exportsTest.tripNumber = tripNumber;
    console.log("Trip Number:", tripNumber);
  });
}

async function getUrlTripNumber() {
  await getTripId();
}

async function sleepInMinutes() {
  await page.evaluate(() => {
        var sleepInMinutes = sleepInMinutes ?? 5;
        const end = Date.now() + sleepInMinutes * 60000;
        while (Date.now() < end) { }
        console.log(`Sleep completed: ${sleepInMinutes} minute${sleepInMinutes !== 1 ? 's' : ''}`);
    
  });
}

async function Copy_of_API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function Copy_of_Api_Validation__Remarks(reqRemarks, fbRemarks) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Cancel_Trip_on__true___boolean__cancelQuote__parameter_() {
  const boolean_11 = await page.evaluate(() => {
    return cancelQuote === true || cancelQuote === "true";
    
  }).catch(() => false);
  if (!boolean_11) {
    return;
  }
  // Converting a 'api-action' step has to be done manually at this time
}

async function Remarks_validation_by_API__exact_input_validation_(requiredRemarks, forbiddenRemarks, username, cancelQuote, sleepInMinutes) {
  await getUrlTripNumber();
  await sleepInMinutes();
  await Copy_of_API_Validation__AuthForAPi(username, "NextLevelAtriis25!", '58294d71f764436fa8282de44cb90cfd');
  await Copy_of_Api_Validation__Remarks(requiredRemarks, forbiddenRemarks);
  await API_Validation__Cancel_Trip_on__true___boolean__cancelQuote__parameter_();
}

