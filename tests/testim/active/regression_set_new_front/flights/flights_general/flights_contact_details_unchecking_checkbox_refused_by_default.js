/*
 * Test Name: 27809: Flights - Contact details - Unchecking checkbox refused by default
 * Description: 
 * Status: Active
 * Labels: Flights,contact info,progress page,Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-04-07T08:21:03Z
 * Updated: 2025-11-26T05:14:10Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('coreytaylor@amadeusclubdubu.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Add_Manual_Quote_Flight_One_Way_LON_MAD();
  await On_Hold___Wait_for_element_text();
  await fill_free_text_justification_in_cart_if_needed();
  await Click_Proceed_to_Checkout();
  await Contact_details___Unchecking_checkbox_refused_by_default();
  await book_and_finalize();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}

function isElementChecked(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.checked;
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

async function On_Hold___Wait_for_element_text() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Contact_details___Unchecking_checkbox_refused_by_default() {
  await waitForText(page, "h1", 'Booking details');
  await waitForText(page, ".app-text-wrap-wrap", /share the contact details with airlines/);
  //TODO Please add an assertion here
await isElementChecked(page, ".el-checkbox");
  await page.click(".el-checkbox__inner");
  await page.type("#el-id-5659-146", '');
  await page.type("#el-id-5659-147", '');
  await page.type("#el-id-5659-148", '');
  await page.type("#el-id-5659-149", '');
  await waitForText(page, ".help", 'Invalid email');
  await page.type("#el-id-5659-146", '123');
  await page.type("#el-id-5659-147", '333');
  await page.type("#el-id-5659-148", '1010');
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

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

