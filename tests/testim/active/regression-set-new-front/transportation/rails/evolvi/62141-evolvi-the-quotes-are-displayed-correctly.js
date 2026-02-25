/*
 * Test Name: 62141 Evolvi> The quotes are displayed correctly
 * Description: The quotes are displayed correctly
 * Status: Active
 * Labels: Rail,Evolvi,Expiry,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-16T12:46:53Z
 * Updated: 2025-09-14T11:55:57Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('corp@evolvi32.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_UK_Rail();
  await Search_Evolvi_one_way();
  await Evolvi___select_first_available_fare();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await Mandatory_fields();
  await page.click(".btn-container span");
  await Book_and_finalize();
  await Check_Quote();
  await Cancel_quote_from_cart_after_checkout();
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

async function Select_UK_Rail() {
  await page.click(".el-input");
  await page.click(".el-select-dropdown span");
  await waitForText(page, "[role='button']", 'Advanced search');
}

async function Search_Evolvi_one_way() {
  await page.click(".radio-btns > :nth-child(2) .el-radio__label");
  await page.click("#el-id-439-183");
  await page.type("#el-id-439-183", 'GLC');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-6829-206");
  await page.type("#el-id-439-184", 'EUS');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-439-185");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(3) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".btn--primary");
  await waitForText(page, ".results-header > :nth-child(2) .trains-info-container > :nth-child(2) > :nth-child(1)", 'Departs');
}

async function Evolvi___select_random_available_fare() {
  await page.evaluate(() => {
    // Select all elements with the specified classes, excluding those with the is-invisible class
    const elements = document.querySelectorAll('.app-price.is-flex.is-mobile.is-justify-content-center.price.is-clickable.el-tooltip__trigger.el-tooltip__trigger');
    
    // Check if there are any elements found
    if (elements.length > 0) {
             
        // Get the first element 
        const randomElement = elements[0];
        
        // Create a new mouse event
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        // Dispatch the event on the selected element
        randomElement.dispatchEvent(event);
        
        //randomElement.pare
    
    } else {
        console.log('No visible elements found with the specified class.');
    }
    
    
    
    
    //old:
    // Select all elements with the specified classes, excluding those with the is-invisible class
    //const elements = document.querySelectorAll('.price-cell.is-flex.is-align-items-center.is-justify-content-center:not(.is-invisible)');
    
    // Check if there are any elements found
    //if (elements.length > 0) {
        // Generate a random index based on the number of elements
    //    const randomIndex = Math.floor(Math.random() * elements.length);
         
        // Get the element at the random index
        //const randomElement = elements[randomIndex];
            
        // Create a new mouse event
        //const event = new MouseEvent('click', {
        //    bubbles: true,
        //    cancelable: true,
        //    view: window
        //});
        
        // Dispatch the event on the selected element
        //randomElement.dispatchEvent(event);
        
        //randomElement.pare
    
    //} else {
    //    console.log('No visible elements found with the specified class.');
    //}
  });
}

async function tab2() {
  await Evolvi___select_random_available_fare();
}

async function Evolvi___select_first_available_fare() {
  await waitForText(page, ".cap", 'Results');
  await tab2();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function UK_Rail__Evolvi__add_to_cart() {
  await waitForText(page, ".selected-prices-container .btn", 'Add to trip');
  await page.click(".uk-rail-results .btn");
  await Pending_booking___wait_for_element_text();
}

async function Mandatory_fields() {
  await page.click(".add-form-payment");
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='checkbox']");
  await page.click(".btn-save");
  await page.click(".uk-rail-delivery-method .is-clickable");
  await page.click(".el-radio-group > :nth-child(1) .el-radio__inner");
  await page.click(".el-tabs .btn--primary");
  await page.click(".uk-rail-seats .is-clickable");
  await page.click("[type='number']");
  await page.type("[type='number']", '912345678');
  await page.click(".el-tabs .btn--primary");
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await page.click(".el-select__placeholder");
  await page.click("#el-id-6829-4590 > span");
  await page.click(".el-tabs .btn--primary");
  await page.click(".el-checkbox__inner");
}

async function Book_and_finalize() {
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await page.click("#el-id-6829-4608");
  await page.type("#el-id-6829-4608", '1234');
  await page.click("#el-id-6829-4609");
  await page.click("#el-id-6829-4609");
  await page.type("#el-id-6829-4609", '4321');
  await page.click("#el-id-6829-4610");
  await page.type("#el-id-6829-4610", '2565');
  await page.click("[class^='btn--width'], [class*=' btn--width']");
}

async function Check_Quote() {
  await page.click(".btn-container > :nth-child(1)");
  //TODO Please add an assertion here
await isVisible(page, ".el-tabs .title-container");
  await waitForText(page, ".segment-route > :nth-child(4)", /Glasgow Central/);
  await waitForText(page, ".segment-route", /London Euston/);
  //TODO Please add an assertion here
await isVisible(page, "[class^='pl'], [class*=' pl'] span");
}

async function Cancel_quote_from_cart_after_checkout() {
  await page.hover("[aria-controls^='dropdown-menu']");
  await page.click("[x-placement='bottom-end'] p");
  await waitForText(page, ".btn--primary", 'Cancel item');
  await page.waitFor(1000);
  await page.click("[aria-label='Cancel item - Chester Hotel Victoria'] .btn--primary");
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  await waitForText(page, ".quote-details > :nth-child(2) p", 'Cancelled successfully');
  await page.click(".close-btn");
}

