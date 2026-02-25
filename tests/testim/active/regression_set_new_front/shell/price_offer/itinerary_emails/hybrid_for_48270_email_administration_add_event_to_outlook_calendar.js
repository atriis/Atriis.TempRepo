/*
 * Test Name: Hybrid for 48270 - Email administration, Add event to Outlook calendar
 * Description: 
 * Status: Active
 * Labels: Email,Administration,outlook calendar,hybrid,Evolvi,Rail,Regression,Hotel,Expedia,progress page,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-04-17T09:43:54Z
 * Updated: 2025-09-17T01:42:05Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('outlook@event.com');
  await click_on_administration();
  await waitForText(page, "[name='settingsForm'] > :nth-child(4) > :nth-child(1) div", 'Corporate main email provider:');
  // Converting a 'html-attr-validation' step has to be done manually at this time
  await page.click("[id='s2id_autogen11'] b");
  //TODO Please add an assertion here
await isVisible(page, "[id='select2-drop'] [class$='results'], [class*='results '] > li:nth-of-type(1) [class$='result-label'], [class*='result-label ']");
  await List_length__with_locator_as_parameter_('3', '.select2-results-dept-0');
  await close_tab___choose_relevant_tab_in_context();
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await UK_Rail__Evolvi____One_way_search_lwith_parameters_('Paddington', 'Bath Spa');
  await Evolvi___select_first_available_fare();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await page.click(".flicking-camera > :nth-child(2) .icon-text");
  await waitForText(page, ".btn--size-large", 'Search');
  await page.type("#el-id-3388-713", 'Bath Spa');
  await page.click("#el-id-3388-686-item-0 > div");
  await page.click("[placeholder='Check in']");
  await page.click("[aria-label='Next Month'] [fill='currentColor']");
  await page.click("[aria-label='Next Month'] [fill='currentColor']");
  await page.click(".is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  await page.click(".btn--size-large");
  await add_hotel_from_search_results_to_cart();
  await Pending_booking___wait_for_element_text();
  await Evolvi___Extras___Cart();
  await page.click(".uk-rail-quote-card .el-checkbox__inner");
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
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

async function click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
}

async function List_length__with_locator_as_parameter_(length, locator) {
  await page.evaluate((length, locator) => {
    const expectedLength = Number(length); // Replace 'length' with the expected number of visible elements
    
    // Convert NodeList to an array, ensure exact matches, and filter for visible elements
    const elements = Array.from(document.querySelectorAll(locator))
      .filter(el => el.matches(locator)) // Ensure the element exactly matches the locator
      .filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)); // Robust visibility check
    
    // Validate the number of visible and exact match elements
    if (elements.length === expectedLength) {
      console.log(`The element appears ${elements.length} times and is visible.`);
    } else {
      throw new Error(`Assertion failed: Expected ${expectedLength} visible elements, but found ${elements.length}.`);
    }
    
  }, length, locator);
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

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_refundable_hotel() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    let refundableRoom=document.querySelector(".refundable.cancellation-terms");
    refundableRoom.parentElement.parentElement.parentElement.parentElement.children[1].firstChild.firstChild.firstChild.children[2].click()
  });
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
  await Pending_booking___wait_for_element_text();
  await waitForText(page, ".ticket-top-section p", 'Refundable');
}

async function Reason_for_Non_Lowest() {
  await waitForText(page, ".uk-rail-non-lowest-reason .card-title", '* Reason for Non Lowest');
  await page.click(".uk-rail-non-lowest-reason .is-clickable");
  await waitForText(page, ".uk-rail-non-lowest-reason .card-title", 'Reason for Non Lowest');
  await page.click("[id^='el-collapse-content'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, "#el-id-3797-83 > span", 'Need More Flexible Ticket');
  await page.click("#el-id-3797-115");
  await page.click(".el-tabs .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-non-lowest-reason .material-symbols-outlined");
}

async function Evolvi___Extras___Cart() {
  await scrollToElement(page, ".uk-rail-delivery-method .is-clickable");
  await page.click(".uk-rail-delivery-method .is-clickable");
  await waitForText(page, ".uk-rail-delivery-method .card-title", 'Delivery Method');
  await page.click(".uk-rail-delivery-method .card-title");
  await page.click(".el-radio-group > :nth-child(1) .el-radio__inner");
  await page.click(".tabs-container .no-border");
  await page.click(".uk-rail-accounts .is-clickable");
  await page.click(".el-select__caret");
  await page.click(".el-scrollbar__view > li:nth-of-type(2) span");
  await page.click(".tabs-container .no-border");
  await page.click(".uk-rail-client-reference .is-clickable");
  await page.type("#el-id-9224-2410", 'testim');
  await page.type("[id='pane-1573870'] > :nth-child(2) [type='text']", '1234');
  await page.type("#el-id-9224-2412", 'yes');
  await page.click("#el-id-8454-2460");
  await page.type("#el-id-8454-2460", 'temp');
  await page.click(".tabs-container .no-border");
  await Reason_for_Non_Lowest();
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

