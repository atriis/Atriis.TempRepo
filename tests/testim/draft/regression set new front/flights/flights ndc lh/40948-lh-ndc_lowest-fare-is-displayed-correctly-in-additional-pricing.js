/*
 * Test Name: 40948 LH NDC - lowest fare is displayed correctly in additional pricing
 * Description: 
 * Status: Draft
 * Labels: Flights,Pricing Options,Keeps failing
 * Owner: Bruna Santos
 * Created: 2024-01-04T04:46:07Z
 * Updated: 2024-05-29T07:29:03Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('claraaguiar@ndclhclara.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('PRG', 'SKP');
  await waitForText(page, ".flight-list > :nth-child(1) .pricing-options", 'Pricing Options');
  await page.click("[placeholder='Search flight']");
  await page.type("[placeholder='Search flight']", 'LH');
  //TODO Please add an assertion here
await getText(page, ".flight-list > :nth-child(1) .amount");
  await page.click(".flight-list > :nth-child(1) .pricing-options");
  await waitForText(page, "h2", 'Flight To        Skopje');
  //TODO Please add an assertion here
await getText(page, ".main-info-wrapper .amount");
  await Comparing_to_see_if_the_price_does_not_change_1();
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

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function Comparing_to_see_if_the_price_does_not_change(firstValue, secondValue) {
  await page.evaluate((firstValue, secondValue) => {
    var equal = firstValue === secondValue
    
    if(!equal){
        throw new Error("Values are different, first value is " + firstValue + " and second value is " + secondValue)
    }
    else{
        console.log("Values are equal")
    }
  }, firstValue, secondValue);
}

async function Comparing_to_see_if_the_price_does_not_change_1() {
  await Comparing_to_see_if_the_price_does_not_change(firstValue, secondValue);
}

