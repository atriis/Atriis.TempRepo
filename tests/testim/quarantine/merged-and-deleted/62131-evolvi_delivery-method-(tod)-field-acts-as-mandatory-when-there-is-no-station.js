/*
 * Test Name: 62131 Evolvi - Delivery Method (TOD) field acts as mandatory when there is no station
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2025-05-16T09:06:11Z
 * Updated: 2025-07-24T10:49:28Z
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
  await UK_Rail__Evolvi____One_way_search_lwith_parameters_('LON', 'RDG');
  await close_mandatory_notification();
  await Evolvi___select_random_available_fare_1();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await Verifying_that_Delivery_Method__TOD__field_acts_as_mandatory_when_there_is_no_station();
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

async function UK_Rail__Evolvi____One_way_search_lwith_parameters_(from, to) {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(1) span");
  await page.click("[id='pane-rails'] [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[aria-activedescendant='el-autocomplete-8871-item--1']", from);
  await sendSpecialCharacter(page, "#el-id-7815-174", 'Tab');
  await page.type("[aria-activedescendant='el-autocomplete-6209-item--1']", to);
  await sendSpecialCharacter(page, "#el-id-7815-175", 'Tab');
  await page.click("[placeholder='Pick-up date']");
  await page.dblclick("[id='el-id-5703-1150'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-5703-1150'] tbody > :nth-child(4) > :nth-child(5)");
  await page.click("form > :nth-child(4) > :nth-child(3) .el-checkbox__inner");
  //TODO Please add an assertion here
await isVisible(page, "[data-track='evolvi-search-split-ticket'] .el-checkbox__inner");
  await page.click(".btn--primary");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
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

async function Evolvi___select_random_available_fare_1() {
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

async function Verifying_that_Delivery_Method__TOD__field_acts_as_mandatory_when_there_is_no_station() {
  await waitForText(page, ".uk-rail-delivery-method .card-title", '* Delivery Method');
  await page.click(".uk-rail-delivery-method .is-clickable");
  await waitForText(page, ".el-radio-group > :nth-child(2) .delivery-option > div:nth-of-type(1) span", 'Atriis - TIcket on Departure (Collect at Station)');
  await page.click(".el-radio-group > :nth-child(2) .el-radio__inner");
  await waitForText(page, ".el-select__placeholder span", 'Select station');
  await page.click(".el-tabs .btn--primary");
  await page.waitForSelector(".el-select__wrapper", {state: "visible"});
  await page.click("[id='el-collapse-content-312'] [xmlns='http://www.w3.org/2000/svg']");
  await page.type("[type='text']", 'edinburgh airport bus');
  await page.click("#el-id-6208-4555");
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-delivery-method .material-symbols-outlined");
  await page.click(".uk-rail-delivery-method .is-clickable");
  await waitForText(page, ".el-select__placeholder span", 'Edinburgh Airport Bus/Tram');
}

