/*
 * Test Name: 37327 Approval flow according to user group - Guest, Copy settings from User Group
 * Description: 
 * Status: Active
 * Labels: Regression,Approval flow,2026 plan 1
 * Owner: Noam Miller
 * Created: 2023-10-25T01:06:49Z
 * Updated: 2026-02-16T01:44:55Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('fabian@apflow.mx');
  await book_a_new_trip();
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await Add_traveler___random_guest__copy_settings_from_user_group();
  await search_car_by_place('ORD');
  await Add_car_to_trip_and_send_for_approval();
  await Validate_approvals();
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
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

async function Add_traveler___random_guest__copy_settings_from_user_group() {
  await page.click(".has-text-weight-semibold");
  await page.click(".el-checkbox__input");
  await page.click(".add-guest-btn");
  await page.click("body > :nth-child(13) [role='radiogroup'] > :nth-child(2) .el-radio__inner");
  await page.waitFor(300);
  await page.click(".copy-settings-container [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-1878-284");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  await page.click(".is-focused .el-select__placeholder span");
  await page.type("#el-id-1878-318", 'israel');
  await page.waitFor(1000);
  await page.click("#el-id-1878-429 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container span");
  await page.click("#el-id-7860-309 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
}

async function old2() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
}

async function old() {
  if (true) {
    return;
  }
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Pick-up Date']");
  await page.type("[placeholder='Pick-up Date']", pickUpDate);
  await sendSpecialCharacter(page, "[placeholder='Pick-up Date']", 'Enter');
  if (false) {
    await page.click("[placeholder='Pick-up Date']");
  }
  if (false) {
    await page.click("[aria-label='Next Month']");
  }
  if (false) {
    await page.click(".el-date-table tbody > :nth-child(6) > td:nth-of-type(2) span");
  }
  await page.click("#el-id-9250-87");
  await page.click("[id='el-id-3812-54'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-993-38 > span");
  await page.waitFor(1000);
  await page.click("[id='el-id-9786-26'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  if (false) {
    await page.click("#el-id-8716-55 > span");
  }
  await page.click("#el-id-7049-91 > span");
  await page.click("[id='el-id-2044-100'] .btn-apply");
  if (false) {
    await page.click("[placeholder='Drop-off Date']");
  }
  if (false) {
    await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(6) > td:nth-of-type(3) span");
  }
  await page.click("#el-id-9250-122");
  await page.waitFor(1000);
  await page.click("[id='el-id-9250-123'] [class^='mr'], [class*=' mr'] .el-select__wrapper");
  await page.click("#el-id-9198-139 > span");
  await page.click("[id='el-id-9198-123'] .section-time-select > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.waitFor(1000);
  await page.click("#el-id-8989-90 > span");
  await page.click("[id='el-id-9151-135'] .btn-apply");
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Drop-off Date']");
  await page.type("[placeholder='Drop-off Date']", dropOffDate);
  await sendSpecialCharacter(page, "[placeholder='Drop-off Date']", 'Enter');
  await page.click(".search-btn");
}

async function search_car_by_place(place) {
  await page.click("#tab-car > div");
  await page.type("[placeholder='Search for Airport, City or Address']", place);
  await page.click(".ellipsis");
  await page.click("#el-id-9045-275");
  await page.click("[id='el-id-9045-99'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-9045-99'] tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click("#el-id-9045-278");
  await page.click("[id='el-id-9045-134'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.type("#el-id-9330-775", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-775", 'Enter');
  if (false) {
    await page.click("#el-id-9330-810");
  }
  await page.type("#el-id-9330-810", '09:00');
  await sendSpecialCharacter(page, "#el-id-9330-810", 'Enter');
  await page.waitFor(1000);
  await page.click(".search-btn");
  await old2();
  await old();
}

async function Add_car_to_trip_and_send_for_approval() {
  await waitForText(page, ".car-list > :nth-child(1) [class^='mt'], [class*=' mt'] p", 'Terms & Conditions');
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await waitForText(page, ".ml-4", 'Pending booking');
  await scrollToElement(page, ".el-checkbox__inner");
  await page.click(".el-checkbox__inner");
  await page.click(".btn-container span");
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__description", 'Your order has been booked and sent to your approver for approval');
}

async function Validate_approvals() {
  await page.click(".btn-container > :nth-child(1)");
  await waitForText(page, ".extra-info p", 'Pay On Departure');
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#dropdown-menu-8728 > li:nth-child(1)");
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, ".approver-name", 'Fabian Jaimes');
  await waitForText(page, ".el-timeline > :nth-child(2) .approver-name", 'Victor Alvarez');
  await page.click("body > :nth-child(15) .el-dialog__close");
  await page.waitFor(1000);
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

