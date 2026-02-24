/*
 * Test Name: 29416 [Merge] GroundScope - Price and pick up time do not change, "Terms and Conditions" are displayed in results, cart and after checkout and booking it
 * Description: 
 * Status: Active
 * Labels: Groundscope Regression,Full Purchase,Terms and Conditions,merge,time,progress page,Pre Prod,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2023-05-25T04:21:26Z
 * Updated: 2025-09-29T04:00:26Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login("elisabeteferreira@groundscope.com");
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Groundscope_search('lhr', 'emirates');
  await click_on_proceed_after_search___warning_and_continue();
  await Validating__Ter();
  await Extract_results_price_and_VAT();
  await Add_to_trip();
  await Check_if_the_time_is_the_same_across_the_system();
  await Checking_if_the_price_in_search__with_vat__is_equal_to_the_price_in_cart();
  await Validate_terms_and_conditions_1();
  await Groundscope___Add_contact_details();
  await Add_credit_card_in_cart();
  await set_CVV_in_cart_if_needed();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await Validating__Terms_and_Conditions__cart();
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

async function add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function Groundscope_search(Pickup, Dropoff) {
  await page.click("[id='tab-groundService'] p");
  await page.click("[popperclass='app-autocomplete-popper ']");
  await page.type("[popperclass='app-autocomplete-popper ']", Pickup);
  await page.click(".ellipsis");
  await page.click("[popperclass='app-autocomplete-popper address-autocomplete-popper']");
  await page.type("[popperclass='app-autocomplete-popper address-autocomplete-popper']", Dropoff);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.click("[placeholder='Today']");
  await page.click("[id='el-id-3464-659'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-3464-659'] tbody > :nth-child(5) > :nth-child(5)");
  await page.click("[placeholder='Pick-up time']");
  await page.type("#el-id-5310-653", 'executive');
  await page.click("#el-id-5550-608 > span");
  await page.waitFor(1000);
  await page.click(".details-container > :nth-child(2) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-6660-916 > span");
  await page.click(".ground-transport-search-content");
  await page.click(".ground-transport-search-content");
  //TODO Please add an assertion here
await getText(page, "#el-id-4372-555");
  await page.click(".search-btn");
  if (false) {
    await page.click(".details-container .is-filterable .el-select__placeholder span");
  }
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search___warning_and_continue() {
  await page.waitFor(1000);
  await proceed();
}

async function Validate_terms_and_conditions() {
  await page.click(".ground-transport-list > :nth-child(1) .terms-and-conditions");
  await waitForText(page, "b", /Additional service partner charges/);
  await page.click("body > :nth-child(21) [xmlns='http://www.w3.org/2000/svg']");
}

async function Validating__Ter() {
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await Validate_terms_and_conditions();
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Extract_results_price_and_VAT() {
  //TODO Please add an assertion here
await getText(page, ".ground-transport-list > :nth-child(1) .price-wrapper > :nth-child(1) .amount");
  //TODO Please add an assertion here
await getText(page, ".ground-transport-list > :nth-child(1) .vat .amount");
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Add_to_trip() {
  await waitForText(page, ".ground-transport-list > :nth-child(1) .btn--primary", 'Add to trip');
  await page.click(".ground-transport-list > :nth-child(1) .desktop-btn");
  await Pending_booking___wait_for_element_text();
}

async function test(valueOne, valueTwo, valueThree) {
  await page.evaluate((valueOne, valueTwo, valueThree) => {
        if (valueOne === valueTwo && valueOne === valueThree) {
            console.log("Time is the same across the system");
        } else {
            throw new Error(`Time mismatch: valueOne=${valueOne}, valueTwo=${valueTwo}, valueThree=${valueThree}`);
        }
  }, valueOne, valueTwo, valueThree);
}

async function Check_if_the_time_is_the_same_across_the_system() {
  //TODO Please add an assertion here
await getText(page, ".pickupdropoff-detailed p");
  await page.click(".more-details");
  await waitForText(page, "#el-id-5631-746 > div > h4", 'Price summary');
  //TODO Please add an assertion here
await getText(page, ".car-more-details p");
  await test(timeSearch, timeCart, timeMoreDetails);
  await page.click(".parking-details-drawer [xmlns='http://www.w3.org/2000/svg']");
}

async function Comparing_two_values_to_see_if_they_are_equal(search, vat, cart) {
  await page.evaluate((search, vat, cart) => {
    const searchFloat = parseFloat(search); 
    const vatFloat = parseFloat(vat);     
    const cartFloat = parseFloat(cart);    
    
    // Define a tolerance for comparison
    const tolerance = 0.99;  // Tolerance level (in this case, 0.01 for 1 cent)
    
    // Calculate the sum of search price and VAT
    const sumPriceAndVatSearch = (searchFloat + vatFloat).toFixed(2);
    
    // Check if the difference between the sum and cart price is within the tolerance
    const difference = Math.abs(parseFloat(sumPriceAndVatSearch) - cartFloat);
    
    // If the difference is smaller than the tolerance, consider them equal
    if (difference > tolerance) {
        throw new Error(`Values are incorrect. The sum (${sumPriceAndVatSearch}) of search price (${searchFloat}) and VAT (${vatFloat}) is not equal to the price in cart (${cartFloat}). Difference: ${difference}`);
    } else {
        console.log("Values are correct.");
    }
    
  }, search, vat, cart);
}

async function Checking_if_the_price_in_search__with_vat__is_equal_to_the_price_in_cart() {
  await waitForText(page, ".product-extra-info-price > :nth-child(1)", 'To pay');
  //TODO Please add an assertion here
await getText(page, ".page-layout-main .amount");
  await Comparing_two_values_to_see_if_they_are_equal(priceSearch, vatSearch, totalPriceCart);
}

async function Validate_terms_and_conditions_1() {
  await scrollToElement(page, "[class^='pt'], [class*=' pt'] a");
  await page.click("[class^='pt'], [class*=' pt'] a");
  await waitForText(page, "b", /Additional service partner charges/);
  await page.click("body > :nth-child(26) [xmlns='http://www.w3.org/2000/svg']");
}

async function Groundscope___Add_contact_details() {
  await waitForText(page, ".el-tabs .card-title", /Contact Information/);
  await page.click(".ticket-layout-container .is-clickable");
  await page.type("[maxlength='3']", '351');
  await page.type(".control > div:nth-of-type(2) [type='number']", '96');
  await page.type(".control > div:nth-of-type(3) [type='number']", '566785');
  await page.click(".tabs-container .no-border");
  await page.waitForSelector(".filled", {state: "visible"});
}

async function Credit_Guard_modal_insert_cc_number(ccNumber) {
  await page.click("[placeholder='Please enter your credit card number']");
  await page.type("[placeholder='Please enter your credit card number']", ccNumber);
  await page.waitFor(500);
  await page.click("body > :nth-child(14) .btn--primary");
}

async function Add_credit_card_in_cart() {
  await page.click(".add-form-payment");
  await page.click(".add-credit");
  await page.click(".form-inputs > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4685-522 > div > div:nth-child(1) > span");
  await page.type("[placeholder='Card holder name']", 'Sunny Atriis');
  await page.click(".form-inputs > :nth-child(5) > :nth-child(1) .el-select__caret");
  await page.click("#el-id-2829-778");
  await page.click(".form-inputs > :nth-child(5) > :nth-child(2) .el-select__caret");
  await page.click("#el-id-2829-1079 > span");
  await page.click(".is-transparent span");
  await page.type("#el-id-2829-1375", 'israel');
  await page.click("#el-id-2829-1492 > span");
  await page.type("[placeholder='City name']", 'Tel Aviv Yafo');
  await page.type("[placeholder='Zip code']", '6654115');
  await page.type("[placeholder='Street name']", 'Yigal Alon 30');
  await page.click(".insertCard");
  await Credit_Guard_modal_insert_cc_number(4580458045804580);
  await page.waitFor(1000);
  await page.click(".btn-save");
  await waitForText(page, ".successfully-saved", /Payment added successfully/);
  await page.click(".open .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
}

async function set_CVV_in_cart_if_needed() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await page.type("[type='number']", '123');
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

async function Validating__Terms_and_Conditions__cart() {
  await scrollToElement(page, "[class^='pt'], [class*=' pt'] a");
  await page.click("[class^='pt'], [class*=' pt'] a");
  await waitForText(page, "b", /Additional service partner charges/);
  await page.click("body > :nth-child(26) [xmlns='http://www.w3.org/2000/svg']");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

