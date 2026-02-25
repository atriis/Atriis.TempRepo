/*
 * Test Name: 61640 Evolvi> expiry - validate counter and tooltip
 * Description: validate counter and tooltip
 * Status: Active
 * Labels: Regression,Rail,Evolvi,Expiry,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-06T10:04:42Z
 * Updated: 2025-09-14T10:53:01Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('thiagosantos@evolvi.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_UK_Rail();
  await Search_Evolvi_one_way();
  await Evolvi___select_first_available_fare();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await Hoover_and_validate_the_expire_counter();
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

async function Close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Search_Evolvi_one_way() {
  await page.click(".radio-btns > :nth-child(2) .el-radio__label");
  await page.click("#el-id-439-183");
  await page.type("#el-id-439-183", '182');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-439-184");
  await page.type("#el-id-439-184", '115');
  await page.click("[id='el-id-2651-172'] p");
  await page.click("#el-id-439-185");
  await page.click("[aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("tbody > :nth-child(3) > td:nth-of-type(2) .el-date-table-cell__text");
  await page.click(".btn--primary");
  await Close_mandatory_notification();
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

async function Hoover_and_validate_the_expire_counter() {
  await page.hover(".app-columns .material-symbols-outlined");
  await waitForText(page, ".timed-quote-badge > :nth-child(2)", new RegExp(/(?:[01]?\d|2[0-3]):([0-5]?\d)/));
  await page.waitForSelector(".fs14", {state: "visible"});
  await waitForText(page, ".fs14", /Your session is valid for /);
  await waitForText(page, ".fs14", / from the time of selection. We recommend completing your booking within this time to avoid changes in fare or availability./);
  await waitForText(page, ".fs14", new RegExp(/(?:[01]?\d|2[0-3]):([0-5]?\d)/));
}

