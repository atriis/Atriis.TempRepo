/*
 * Test Name: 53437 Travel Policy - Outbound and inbound flights are differentiated on a Travel Policy
 * Description: 
 * Status: Active
 * Labels: Regression,Travel policy,Administration,OOP,Flights,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-03-13T09:27:09Z
 * Updated: 2025-11-26T05:46:11Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('emma@iberiaoop.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip('LIS', 'MAD');
  await Flight___Results___Wait_for__Add_to_trip__text();
  await page.click(".sort-by-wrapper .is-flex .mr-2");
  await page.click("#el-id-6743-86 > li:nth-child(1)");
  await waitForText(page, ".flight-list > :nth-child(1) .out-of-policy-badge", 'Out of policy');
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(2) .flight-duration > :nth-child(1) .flight-time");
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .flight-info-wrapper > :nth-child(3) .flight-duration > :nth-child(1) .flight-time");
  await Hour_validation();
  await page.hover(".flight-list > :nth-child(1) .extra-info .info-icon");
  await waitForText(page, "#el-id-6743-906 > ul > li", /Any Flight/);
  await click_on_administration();
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
  await page.click("[title='Travel Policies']");
  await Warning___Unsaved_items();
  await page.click("[placeholder='Search policy name']");
  await page.type("[placeholder='Search policy name']", 'TESTIM_7');
  await page.click("[ng-click='onTravelPolicyItemClicked(travelPolicy)'] .ng-binding");
  await waitForText(page, "[data-ng-click='onAddNewTravelPolicyRuleClicked()'] span", 'Add New Travel Policy Rule');
  await page.click("[data-ng-repeat='travelPolicyRule in travelPolicyRules | filter:showActiveInActive | filter:searchText | orderBy:\'Product\''] > :nth-child(1)");
  await waitForText(page, "[ng-switch-when='0'] > :nth-child(5) > :nth-child(1) label", 'Action');
  await waitForText(page, "#s2id_autogen115 > a > span.select2-chosen", 'Any Flight');
  await page.click("[id='s2id_autogen115'] b");
  await waitForText(page, "#select2-drop > ul > li.select2-results-dept-0.select2-result.select2-result-selectable.ng-binding.ng-scope.select2-highlighted > div", 'Any Flight');
  await waitForText(page, "#select2-drop > ul > li.select2-results-dept-0.select2-result.select2-result-selectable.ng-binding.ng-scope.select2-highlighted > div", 'Inbound Flight');
  await waitForText(page, "#select2-drop > ul > li:nth-child(3) > div", 'Outbound Flight');
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

async function old_date_picker() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Depart Date']");
  await page.type("[placeholder='Depart Date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Depart Date']", 'Enter');
  await page.click("[placeholder='Return Date']");
  await page.type("[placeholder='Return Date']", returnDate);
  await sendSpecialCharacter(page, "[placeholder='Return Date']", 'Enter');
  await page.click(".trip-search-control");
}

async function Search_flights_round_trip(from, to) {
  await page.click("[id='tab-flight'] p");
  await page.click("[placeholder='From... Departure']");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4024-715", 'Tab');
  if (false) {
    await page.waitFor(500);
  }
  if (false) {
    await page.click("#el-id-4704-692-item-0 > div");
  }
  await page.click("[placeholder='To... Destination']");
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4619-900", 'Tab');
  if (false) {
    await page.click(".ellipsis");
  }
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await old_date_picker();
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Hour_validation() {
  await page.evaluate(() => {
    if (inbound > "08:01" || outbound > "08:01") {
        console.log("At least one value is greater than 08:01. Code passes.");
    } else {
        throw new Error(`Both values are less than or equal to 08:01. Value: ${inbound}, Value2: ${outbound}`);
    }
  });
}

async function click_on_administration() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[name='settingsForm'] .admin-field-group > :nth-child(1) label", 'Name:');
}

async function Warning___Unsaved_items() {
  if (await getText(page, "#ui-id-1") !== "'There are some unsaved items in this screen. What would you like to do?'") {
    return;
  }
  await page.click("[aria-describedby='ui-id-5'] .ui-dialog-buttonset > :nth-child(2)");
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

