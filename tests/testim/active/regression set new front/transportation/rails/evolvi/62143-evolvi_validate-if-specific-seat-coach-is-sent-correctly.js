/*
 * Test Name: 62143 Evolvi>  Validate if specific seat coach is sent correctly
 * Description:  Validate if specific seat coach is sent correctly
 * Status: Active
 * Labels: Rail,Evolvi,Expiry,Regression,Transportation,2026 plan 2
 * Owner: Pedro Carneiro
 * Created: 2025-05-16T06:00:16Z
 * Updated: 2025-09-14T11:57:07Z
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
  await Search_Evolvi_one_way();
  await Evolvi___select_first_available_fare();
  await UK_Rail__Evolvi__add_to_cart();
  await Pending_booking___wait_for_element_text();
  await Adding_seats();
  await Fill_out_Evolvi__UK_Rail__extras_in_cart();
  await Adding_invoice_as_FOP();
  await Accept__Terms___Conditions__and_proceed_to_checkout();
  await Book_and_finalize_1();
  await Check_Quote();
  await Validate_Seat_details();
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

async function Search_Evolvi_one_way() {
  await page.click(".trip-index [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1547-25");
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

async function Adding_seats() {
  await waitForText(page, ".uk-rail-seats .card-title", '* Seating');
  await page.click(".uk-rail-seats .is-clickable");
  await waitForText(page, "[id='el-id-8475-351'] > :nth-child(2) .el-radio__label", 'Specific Seat');
  await page.click("[id='el-id-8475-351'] > :nth-child(2) .el-radio__inner");
  await waitForText(page, "[class^='mb'], [class*=' mb'] > :nth-child(3) p", 'Telephone');
  await page.type("[type='number']", '912345678');
  await page.click("[id='pane-overview'] .btn--primary");
  await waitForText(page, ".uk-rail-seats .card-title", '* Seating');
  //TODO Please add an assertion here
await isVisible(page, ".uk-rail-seats .material-symbols-outlined");
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

async function Fill_out_Evolvi__UK_Rail__extras_in_cart() {
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

async function Adding_invoice_as_FOP() {
  await page.click(".add-form-payment");
  await page.click(".select-credit-card > :nth-child(1) > :nth-child(2) > :nth-child(1) [type='checkbox']");
  await page.click(".btn-save");
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

async function Accept__Terms___Conditions__and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Reference_fields() {
  await page.type("#el-id-6829-4608", '1234');
  await page.type("#el-id-6829-4609", '4321');
  await page.type("#el-id-460-2648", '1234');
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

async function Book_and_finalize_1() {
  await waitForText(page, "h1", 'Booking details');
  await Reference_fields();
  await Book_and_finalize();
}

async function Check_Quote() {
  //TODO Please add an assertion here
await isVisible(page, ".el-tabs .title-container");
  await waitForText(page, ".segment-route", /Glasgow Central/);
  await waitForText(page, ".segment-route", /London Euston/);
  //TODO Please add an assertion here
await isVisible(page, "[class^='pl'], [class*=' pl'] span");
}

async function Specific_Seat() {
  await page.evaluate(() => {
    // Get the <p> element by class (you could refine this further if needed)
    const seatInfo = document.querySelector('p.fs14');
    
    if (!seatInfo) {
        throw new Error("Seat info element not found.");
    }
    
    // Extract text and search for "Coach: X"
    const text = seatInfo.innerText;
    const match = text.match(/Coach:\s*([A-Z])/);
    
    // Validate the match
    if (!match) {
        throw new Error("Coach value not found or not a valid single letter.");
    }
    
    const coach = match[1];
    if (!/^[A-Z]$/.test(coach)) {
        throw new Error(`Coach value is invalid: "${coach}"`);
    }
    
    // Optional: log to console for debugging
    console.log("Coach letter is valid:", coach);
    
  });
}

async function test() {
  await Specific_Seat();
}

async function Validate_Seat_details() {
  await page.click("[class^='pl'], [class*=' pl'] span");
  await test();
  await page.click("[aria-label='More details'] [fill='currentColor']");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

