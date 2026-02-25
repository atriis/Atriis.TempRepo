/*
 * Test Name: 69693 the items order considering the departure day
 * Description: only considering the departure for each product. One exception: hotels. For hotels, the "departure" should be 5 mins before midnight
 * Status: Draft
 * Labels: 
 * Owner: pini harush
 * Created: 2025-11-02T01:59:36Z
 * Updated: 2025-11-03T06:22:02Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('Pini@tlgtest.im');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_Manual_Quote_Flight_One_Way_LON_MAD();
  await Add_hotel_manual_quote();
  await Add_car_manual_quote();
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

async function getTheOpenListIndex(element) {
  await page.evaluate((element) => {
    // Get the index of the currently visible (open) dropdown popper
    function getOpenDropdownIndex() {
        // 1. Select ALL dropdown popper containers using a common class.
        const allPoppers = document.querySelectorAll('.el-popper');
    
        // 2. Iterate through the collection to find the open one.
        for (let i = 0; i < allPoppers.length; i++) {
            const popper = allPoppers[i];
            
            // Get the value of the style attribute. If null, treat it as an empty string.
            const style = popper.getAttribute('style') || '';
    
            // 3. Check for the definitive "open" state: the style attribute MUST NOT contain "display: none".
            // This is more reliable than aria-hidden for visual visibility.
            if (!style.includes('display: none')) {
                
                // Return the 1-based index (i + 1)
                return i + 1;
            }
        }
    
        // Return 0 if no dropdown is currently found to be open/visible.
        return 0;
    }
    
    // Example of how to call the function and use the result
    const openIndex = getOpenDropdownIndex();
    
    // Log the result (or return it as a step output variable in your automation tool)
    console.log("The 1-based index of the open dropdown is:", openIndex);
    
    exportsTest.index = openIndex
    
    // return openIndex; // Uncomment this line if your automation tool requires a return value
  }, element);
}

async function Add_Manual_Quote_Flight_One_Way_LON_MAD() {
  await page.click(".is-capitalized");
  await waitForText(page, ".flight-number", 'Flight 1');
  await page.type("#el-id-1095-4118", 'lon');
  await page.click("[id='el-id-1095-3383-item-0'] .ellipsis");
  await page.click("#el-id-1095-3386");
  await page.click("[id='el-id-7956-3351'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex(".trip-app > :nth-child(1)");
  await page.click("[id^='el-id'] span");
  await page.click(".page-view .is-align-items-end");
  if (false) {
    await page.click("[id='el-id-1095-3387'] .btn-apply");
  }
  await page.type("#el-id-1095-4123", 'mad');
  await page.click("[id='el-id-1095-3477-item-0'] .has-text-weight-bold");
  await page.click("#el-id-1095-3480");
  await page.click("[id='el-id-472-3433'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex(".page-view > :nth-child(1)");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='pane-flight'] h4");
  if (false) {
    await page.click("[id='el-id-7704-2568'] [name='minutes'] svg");
  }
  if (false) {
    await page.click("#el-id-7704-2587 > span");
  }
  if (false) {
    await page.click("[id^='el-id-1095-3481'] .btn-apply");
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("#el-id-1095-4119");
  await page.click("[id='el-id-1095-3385'] [aria-label='Next Month'] svg");
  await page.click("[id='el-id-1095-3385'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  if (false) {
    await page.type(".manual-quote-flight-segment > :nth-child(2) [placeholder='DD MM YYYY']", dateFromFlight);
  }
  await page.type("#el-id-1095-4128", '1235');
  await page.type("#el-id-1095-4132", 'rewq23');
  await page.type("#el-id-1095-4133", 'el al');
  await page.click("#el-id-1095-3779 > span");
  await page.type("#el-id-1095-3378", '1');
  await page.type("[name='tax']", '20');
  await page.type("#el-id-1077-2584", '5');
  await page.waitFor(2000);
  await page.click(".add-quote-btn");
}

async function Add_hotel_manual_quote() {
  await page.click(".is-capitalized");
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[id='tab-hotel'] p");
  await page.click("[placeholder='Search by hotel name, city name or landmark']");
  await page.type("[placeholder='Search by hotel name, city name or landmark']", 'PDX');
  await page.click("#el-id-2890-3606-item-0 > div");
  await page.click(".search-hotel-btn");
  await waitForText(page, ".hotel-results > :nth-child(1) .btn", 'Choose');
  await page.click(".hotel-results > :nth-child(3) .btn");
  await page.click("[placeholder='City']");
  await page.type("[placeholder='City']", 'Portland');
  await page.click("[id='el-autocomplete-5312-item-0'] p");
  await page.waitFor(1000);
  await page.click("#el-id-9492-4664");
  await page.click("[id='el-id-9492-4410'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9492-4410'] tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9492-4665");
  await page.click("[id='el-id-9492-4411'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  if (false) {
    await page.type("#el-id-1381-4970", hotelCheckInDate);
  }
  if (false) {
    await page.type("#el-id-1381-4971", hotelCheckOutDate);
  }
  await page.click("[id='pane-hotel'] .manual-quote-form > :nth-child(4) .el-input--suffix");
  await page.click("[x-placement='top-start'] .el-scrollbar__view > li:nth-of-type(5) span");
  await page.click("[id='pane-hotel'] [placeholder='Confirmation Number']");
  await page.type("[id='pane-hotel'] [placeholder='Confirmation Number']", '34478316577');
  await page.click("[placeholder='Room description']");
  await page.type("[placeholder='Room description']", 'standard double');
  await page.click("[id='pane-hotel'] .price-section > :nth-child(1) [type='number']");
  await page.type("[id='pane-hotel'] .price-section > :nth-child(1) [type='number']", '78');
  await page.click("[id='pane-hotel'] .price-section > :nth-child(3) [type='number']");
  await page.type("[id='pane-hotel'] .price-section > :nth-child(3) [type='number']", '36');
  await page.click(".add-quote-btn");
  await waitForText(page, ".btn-container span", 'Proceed to Checkout');
}

async function choose_hour() {
  if (true) {
    return;
  }
  await page.click("#el-id-6756-8683");
}

async function choose_hour_1() {
  if (true) {
    return;
  }
  await page.click("#el-id-8772-8719 > span");
}

async function Add_car_manual_quote() {
  await page.click(".is-capitalized");
  await waitForText(page, "[id='pane-flight'] h4", 'Flight manual quote');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[id='tab-car'] p");
  await page.type("[aria-activedescendant^='el-autocomplete']", 'PDX');
  await sendSpecialCharacter(page, "#el-id-4392-8543", 'Tab');
  await page.type("[aria-activedescendant='el-autocomplete-6594-item--1']", 'portland');
  await sendSpecialCharacter(page, "#el-id-4392-8544", 'Tab');
  await page.type("[aria-activedescendant='el-autocomplete-3576-item--1']", 'SFO');
  await sendSpecialCharacter(page, "#el-id-4392-8548", 'Tab');
  await page.type("[aria-activedescendant='el-autocomplete-9692-item--1']", 'san francisco');
  await sendSpecialCharacter(page, "#el-id-3594-8083", 'Tab');
  if (false) {
    await page.type("#el-id-4392-8545", carDate);
  }
  await page.click("#el-id-6574-150");
  await page.click("[id='el-id-1169-8603'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await choose_hour();
  await getTheOpenListIndex(".page-view > :nth-child(1)");
  await page.click("[id^='el-id'] span");
  await page.click("#pane-car > section > section > h4");
  if (false) {
    await page.click("[id='el-id-4392-8047'] .btn-apply");
  }
  await page.click("#el-id-6574-236");
  await page.click("[id='el-id-8064-8955'] [class^='mr'], [class*=' mr'] [fill='currentColor']");
  await getTheOpenListIndex(".page-view > :nth-child(1)");
  await page.click("[id^='el-id'] span");
  await choose_hour_1();
  await page.click("#pane-car > section > section > h4");
  if (false) {
    await page.click("[id='el-id-6574-237'] .btn-apply");
  }
  await page.click(".is-focused svg");
  await page.click("#el-id-6574-326 > span");
  await page.type("#el-id-6574-661", 'avis');
  await page.click("#el-id-6574-385 > span");
  await page.click("#el-id-1681-7413");
  await page.click("#el-id-1681-6909 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("[id='el-id-1681-6909'] tbody > :nth-child(5) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.type("#el-id-6574-662", 'no limitation');
  await page.type("#el-id-6574-663", '966231A');
  await page.type("#el-id-6574-669", '60');
  await page.type("#el-id-6574-670", '24');
  await page.click(".add-quote-btn");
  await waitForText(page, ".btn-container span", 'Proceed to Checkout');
}

