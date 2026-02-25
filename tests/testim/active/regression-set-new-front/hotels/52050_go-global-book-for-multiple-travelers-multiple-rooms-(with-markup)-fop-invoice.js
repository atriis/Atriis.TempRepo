/*
 * Test Name: 52050 - Go Global: Book for multiple travelers, multiple rooms (with markup), FOP Invoice
 * Description: 'Valladolid'
can change to madrid to barcelona, can change to 6 nights instead of 10
 * Status: Active
 * Labels: Hotel,Go Global,Regression,Club,multi pax,Daily Hotels,66444 hotel results,2026 plan 1
 * Owner: Noam Miller
 * Created: 2024-10-07T02:33:42Z
 * Updated: 2026-01-05T11:31:00Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ggInvoice@club.com');
  await New_trip__select_product__Hotel_();
  await Add_4_travelers();
  await Search_hotel__2_rooms('madrid');
  await Product_specific_reference_field__hotel_non_legacy();
  await Add_room_to_cart();
  await Validate_info_in_cart__before_checkout();
  await scrollTo(page, 0, 357);
  await Additional_preferences_when_more_than_1_room();
  await Checkout_and_complete_booking();
  await Validate_info_in_cart__after_checkout();
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

async function scrollOnElement(page, selector, x, y) {
  await page.evaluate(([selector, x, y]) => {
    const element = document.querySelector(selector);
    element.scroll(x, y);
  }, [selector, x, y]);
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

async function New_trip__select_product__Hotel_() {
  await book_a_new_trip();
  //TODO Please add an assertion here
await isVisible(page, "[aria-controls='el-id-3609-32']");
  await page.click("[id='tab-hotel'] p");
  //TODO Please add an assertion here
await isVisible(page, ".hotel-search-cmp > :nth-child(2)");
}

async function Generate_random_first_and_last_name() {
  await page.evaluate(() => {
    //Arrays containing first names and last names
    
    const firstNames = [
    
      "Tyler",
      "Levi",
      "Daniel",
      "David",
      "William",
      "Adam",
      "Alex",
      "Christian",
      "Jacob",
      "Stephan",
      "Elijah",
      "David",
      "Diego",
      "Owen",
      "Ethan",
      "Jaylen",
      "Leandro",
      "Lucas",
      "Damian",
      "Austin",
      "Mateo",
      "Elias",
      // Add more first names here
    
    ];
    
    const lastNames = [
    
      "Sullivan",
      "Green",
      "Lee",
      "Leigh",
      "Diaz",
      "Morgan",
      "Bishop",
      "Pereira",
      "Silva",
      "Quinn",
      "Casey",
      "Reyes",
      "Murray",
      "Dimitriou",
      "Avery",
      "Griffin",
      "Silva",
      "Adams",
      "Kroll",
      "Kohler",
      "Evans",
      "Martin",
      "Hughes",
      // Add more last names here
    
    ];
    
    // Function to generate a random name
    
    function generateRandomFirstName() {
    
      const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    
      exportsTest.randomFN = randomFirstName;
    
    }
    
    function generateRandomLastName() {
    
      const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
      exportsTest.randomLN = randomLastName;
    
    }
    
    // Example usage
    
    const randomFName = generateRandomFirstName();
    
    console.log(randomFName);
    
    
    const randomLName = generateRandomLastName();
    
    console.log(randomLName);
  });
}

async function Copy_of_Add_traveler_pax1() {
  await page.click(".travelers-list > section:nth-of-type(1) .traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
}

async function Copy_of_Add_traveler_pax1_1() {
  await page.click(".travelers-list > section:nth-of-type(2) .traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
}

async function Copy_of_Add_traveler_pax2() {
  await page.click(".travelers-list > section:nth-of-type(3) .traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
}

async function Copy_of_Add_traveler_pax2_1() {
  await page.click(".travelers-list > section:nth-of-type(4) .traveler-name");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
}

async function Add_4_travelers() {
  await page.click(".hotel-search-cmp > :nth-child(2) > :nth-child(3) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-2402-72 > span");
  //TODO Please add an assertion here
await isVisible(page, ".travelers-list");
  await page.click(".hotel-search-cmp > :nth-child(2) > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-3609-54 > span");
  await Copy_of_Add_traveler_pax1();
  await Copy_of_Add_traveler_pax1_1();
  await Copy_of_Add_traveler_pax2();
  await Copy_of_Add_traveler_pax2_1();
}

async function choose_checkin_date__13(element) {
  await page.evaluate((element) => {
    const dateElements = document.querySelectorAll('.el-date-table-cell__text');
    
    const targetDate = Array.from(dateElements).find(el => el.textContent.trim() === '13');
    
    if (targetDate) {
        targetDate.click();
    } else {
        console.error("Date element '13' not found.");
    }
  }, element);
}

async function choose_checkout_date_19(element) {
  await page.evaluate((element) => {
    const dateElements = document.querySelectorAll('.el-date-table-cell__text');
    
    const targetDate = Array.from(dateElements).find(el => el.textContent.trim() === '19');
    
    if (targetDate) {
        targetDate.click();
    } else {
        console.error("Date element '19' not found.");
    }
  }, element);
}

async function old() {
  if (true) {
    return;
  }
  await page.click("[id='el-id-1360-28'] .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".end-date .el-date-table-cell__text");
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("[id='el-id-1850-25'] .is-right tbody > :nth-child(4) > td:nth-of-type(1) .el-date-table-cell__text");
  }
  if (false) {
    await page.click(".end-date .el-date-table-cell__text");
  }
}

async function Search_hotel__2_rooms(destination) {
  await page.click("#el-id-2938-76");
  await page.type("#el-id-2938-76", destination);
  await page.click("[id='el-id-2938-55-item-0'] .has-text-weight-bold");
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-1556-38'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("[id='el-id-1556-38'] .arrow-right [xmlns='http://www.w3.org/2000/svg']");
  await choose_checkin_date__13("[id='el-id-1556-38'] .is-right");
  await page.waitFor(1000);
  await choose_checkout_date_19("[id='el-id-1556-38'] .is-right");
  await old();
  await page.click(".btn--primary");
}

async function Product_specific_reference_field__hotel_non_legacy() {
  await waitForText(page, ".label", 'General Remark-Show on New Trip');
  await page.click("body > :nth-child(16) .btn--primary");
  //TODO Please add an assertion here
await isVisible(page, ".hotel-list > :nth-child(1) .hotel-supplier-carousel");
}

async function Price_breakdown() {
  await page.click(".room-list > :nth-child(2) .is-hidden-mobile");
  //TODO Please add an assertion here
await isVisible(page, ".room-price-details");
  //TODO Please add an assertion here
await getText(page, "tbody > :nth-child(2) > td:nth-of-type(2)");
  //TODO Please add an assertion here
await getText(page, "body > :nth-child(26) .price-details > :nth-child(7) .amount");
  await page.click("body > :nth-child(26) [fill='currentColor']");
}

async function Add_room_to_cart() {
  await page.click(".hotel-list > :nth-child(2) .more-details-btn");
  await waitForText(page, ".hotel-overview h3", 'Overview');
  //TODO Please add an assertion here
await isVisible(page, ".hotel-amenities");
  await page.click(".hotel-drawer-preview .btn");
  await waitForText(page, "#tab-overview", 'Overview');
  await scrollTo(page, 0, 500);
  //TODO Please add an assertion here
await isVisible(page, ".room-list > :nth-child(2) .ticket-top-section");
  //TODO Please add an assertion here
await getText(page, ".is-6");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await Price_breakdown();
  await page.click(".room-list > :nth-child(2) .no-padding");
  await waitForText(page, ".app-terms-conditions > :nth-child(2) .terms-title", 'Remarks');
  await page.click("[class^='ml'], [class*=' ml']");
  await page.waitFor(1000);
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Validate_info_in_cart__before_checkout() {
  await page.click(".more-details .is-flex > :nth-child(1)");
  //TODO Please add an assertion here
await isVisible(page, ".row4");
  await scrollOnElement(page, ".el-drawer__body", 0, 560);
  //TODO Please add an assertion here
await getText(page, ".gray-section > :nth-child(13) .amount");
  await waitForText(page, ".gray-section > :nth-child(1) .amount", perNight);
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[aria-label='More details'] [xmlns='http://www.w3.org/2000/svg']");
}

async function Additional_preferences_when_more_than_1_room() {
  await page.click(".extras-container > :nth-child(2) > :nth-child(2) .is-clickable");
  await waitForText(page, ".extras-collapse-container .is-flex-direction-column > label:nth-of-type(1) .el-checkbox__label", 'Request adjoining rooms');
  await waitForText(page, ".extras-collapse-container .is-flex-direction-column > label:nth-of-type(2) .el-checkbox__label", 'Request connected rooms');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[id='pane-overview'] .btn--default");
}

async function Fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
}

async function Reference_fields_at_checkout() {
  // Converting a 'validation-code-step' step has to be done manually at this time
  await waitForText(page, ".label", 'Show on Checkout only when non-gds hotel');
}

async function Checkout_and_complete_booking() {
  await waitForText(page, ".fop-owner", 'Paid by  TMC');
  await Fill_free_text_justification_in_cart_if_needed();
  await page.click(".el-checkbox__inner");
  await page.click(".btn-container span");
  await page.waitForSelector(".notifications-behalf-collapse", {state: "visible"});
  await Reference_fields_at_checkout();
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await waitForText(page, ".success-message__description", 'Your order has been processed successfully');
}

async function Validate_info_in_cart__after_checkout() {
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".app-label", 'Confirmed');
  await scrollTo(page, 0, 228);
  //TODO Please add an assertion here
await isVisible(page, ".pnr");
  await page.click(".more-details .is-flex > :nth-child(1)");
  //TODO Please add an assertion here
await isVisible(page, ".row4");
  await scrollOnElement(page, ".el-drawer__body", 0, 500);
  await waitForText(page, ".gray-section > :nth-child(3) .amount", perNight);
  await waitForText(page, ".gray-section > :nth-child(13) .amount", grandTotalCart);
  await page.click("[aria-label='More details'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[class^='py'], [class*=' py']");
  //TODO Please add an assertion here
await isVisible(page, ".app-terms-conditions > :nth-child(1) .terms");
  await page.click("body > :nth-child(25) [xmlns='http://www.w3.org/2000/svg']");
  await page.hover(".options-container");
  await page.click("#el-id-9556-13 > li:nth-child(3)");
  await waitForText(page, "#el-id-9556-27 > div > section > div.mb-4 > p", 'You are about to cancel all items in your trip.');
  await page.click("[aria-label='Trip cancellation'] .btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

