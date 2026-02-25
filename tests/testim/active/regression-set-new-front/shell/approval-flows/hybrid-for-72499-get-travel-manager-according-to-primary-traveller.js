/*
 * Test Name: HYBRID for 72499> Get Travel Manager according to primary traveller
 * Description: the test book for other pax and activate note to the travel manager of the primary pax

GDG
AAA testim
 * Status: Active
 * Labels: Regression,Approval flow,2026 plan 2
 * Owner: pini harush
 * Created: 2026-01-12T08:38:08Z
 * Updated: 2026-01-12T09:09:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('robsoncruz@sabrecargdg.com');
  await Book_a_new_trip();
  await Add_traveler___By_name('liko@kiko.com');
  await Add_car_manual_quote();
  await Click_Proceed_to_Checkout();
  await page.type("#el-id-108-3269", '1');
  await Book_and_finalize();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function Add_traveler___By_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function choose_hour() {
  if (true) {
    return;
  }
  await page.click("#el-id-6756-8683");
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

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

