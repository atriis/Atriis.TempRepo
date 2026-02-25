/*
 * Test Name: 62132 Evolvi> Validate mandatory fields during checkout
 * Description: Validate mandatory fields
 * Status: Active
 * Labels: Rail,Evolvi,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-15T05:42:46Z
 * Updated: 2025-09-17T12:04:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
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
  await Logout();
  await close_tab___choose_relevant_tab_in_context();
  await Login('eve@levi.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Select_UK_Rail_1();
  await Search_Evolvi_one_way_1();
  await Evolvi___select_first_available_fare();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await Mandatory_fields_1();
  //TODO Please add an assertion here
await isVisible(page, "[class^='btn--width'], [class*=' btn--width']");
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
  await page.type("#el-id-439-183", '182');
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("#el-id-439-184");
  await page.type("#el-id-439-184", '115');
  await page.click("[id='el-id-2651-172'] p");
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
  await page.click(".btn-container span");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".disabled span");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-delivery-method .extra");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-seats .extra");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-non-lowest-reason .extra");
  //TODO Please add an assertion here
await isVisible(page, ".ticket-layout > :nth-child(3)");
  await page.click(".uk-rail-delivery-method .is-clickable");
  await page.click(".el-radio-group > :nth-child(1) .el-radio__inner");
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".uk-rail-seats .is-clickable");
  await page.click("[type='number']");
  await page.type("[type='number']", '9123456789');
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await page.click(".el-select__placeholder");
  await page.click("#el-id-1436-2482");
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".el-checkbox__inner");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-delivery-method .extra");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-seats .extra");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-non-lowest-reason .extra");
  //TODO Please add an assertion here
await isVisible(page, ".el-checkbox__inner");
  await page.waitForSelector(".btn-container span", {state: "visible"});
}

async function Logout() {
  await page.click(".logout-icon");
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function Select_UK_Rail_1() {
  await page.click(".el-input");
  await page.click(".el-select-dropdown span");
  await waitForText(page, "[role='button']", 'Advanced search');
}

async function close_mandatory_notification() {
  await page.waitForSelector("body > :nth-child(16) .el-dialog__title", {state: "visible"});
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("body > :nth-child(16) .btn");
}

async function Search_Evolvi_one_way_1() {
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
  await close_mandatory_notification();
  await waitForText(page, ".results-header > :nth-child(2) .trains-info-container > :nth-child(2) > :nth-child(1)", 'Departs');
}

async function Mandatory_fields_1() {
  await page.click(".btn-container span");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".disabled span");
  await page.click(".uk-rail-delivery-method .extra");
  await page.click(".uk-rail-seats .extra");
  await page.click(".uk-rail-non-lowest-reason .extra");
  await page.click(".uk-rail-client-reference .extra");
  await page.click(".terms > :nth-child(1)");
  await page.click(".uk-rail-delivery-method .is-clickable");
  await page.click(".el-radio-group > :nth-child(1) .el-radio__inner");
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".uk-rail-seats .is-clickable");
  await page.click("[type='number']");
  await page.type("[type='number']", '9123456789');
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await page.click(".uk-rail-non-lowest-reason [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6964-4624 > span");
  await page.click(".uk-rail-non-lowest-reason .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".uk-rail-client-reference .is-clickable");
  await page.click("#el-id-6964-4650");
  await page.type("#el-id-6964-4650", 'To');
  await page.click("#el-id-6964-4651");
  await page.type("#el-id-6964-4651", 'Test');
  await page.click(".tabs-container .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".disabled");
  await page.click(".el-checkbox__inner");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-delivery-method .extra");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-seats .extra");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-non-lowest-reason .extra");
  await page.click(".uk-rail-client-reference .extra");
  //TODO Please add an assertion here
await isVisible(page, ".el-checkbox__inner");
  await page.waitForSelector(".btn-container span", {state: "visible"});
  await page.click(".btn-container span");
}

