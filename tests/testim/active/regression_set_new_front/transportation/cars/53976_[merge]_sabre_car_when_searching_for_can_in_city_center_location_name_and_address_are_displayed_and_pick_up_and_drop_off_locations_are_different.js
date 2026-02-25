/*
 * Test Name: 53976 [Merge] Sabre - Car - When searching for can in city center, location name and address are displayed, and pick up and drop off locations are different when searching for different locations
 * Description: 
 * Status: Active
 * Labels: Regression,Sabre,Cars,merge,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-11-06T01:48:33Z
 * Updated: 2025-07-16T05:58:08Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('penelopecruz@gdgsabrecansearchcarcenter.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_car_pick_up_and_drop_off_different('London,United Kingdom,(LON)', 'Oxford, UK');
  await Car___Results___Wait_for__Select__text();
  await page.waitForSelector(".car-vendor-station-list > :nth-child(1) .station-details > :nth-child(2) > :nth-child(1)", {state: "visible"});
  //TODO Please add an assertion here
await isVisible(page, ".car-vendor-station-list > :nth-child(1) .station-details > :nth-child(2) > :nth-child(2)");
  await Car___Results___Click__Select_();
  // Converting a 'css-prop-validation' step has to be done manually at this time
  await Car___Results___Click__Select_();
  await Car___Results___Wait_for__Add_to_trip__text();
  //TODO Please add an assertion here
await getText(page, ".car-list > :nth-child(1) .pickup-details [target='_blank']");
  //TODO Please add an assertion here
await getText(page, ".car-list > :nth-child(1) .dropoff-details [target='_blank']");
  await Verify_two_strings_are_not_equal(pickUp, dropOff);
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

async function Search_car_pick_up_and_drop_off_different(pickUp, dropOff) {
  await page.click("#tab-car > div");
  await page.click("[id='pane-car'] .el-checkbox__inner");
  await page.type("#el-id-1330-266", pickUp);
  await page.waitFor(2000);
  await page.click("#el-id-5811-28-item-0 > div");
  await page.waitFor(1000);
  await page.type("#el-id-1330-282", dropOff);
  await page.waitFor(2000);
  await page.click("#el-id-1330-280-item-0 > div");
  await page.click("#el-id-1330-267");
  await page.dblclick("[id^='el-id'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click(".el-zoom-in-top-enter-from tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1330-270");
  await page.click("[id^='el-id'] tbody > :nth-child(5) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".btn--primary");
}

async function Car___Results___Wait_for__Select__text() {
  await waitForText(page, ".btn--primary", 'Select');
}

async function Car___Results___Click__Select_() {
  await Car___Results___Wait_for__Select__text();
  await page.click(".btn--primary");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function Verify_two_strings_are_equal() {
  await page.evaluate(() => {
    const firstString = String(valueOne);
    const secondString = String(valueTwo);
    
    const equal = firstString === secondString;
    
    if (equal) {
        throw new Error(`Strings are equal: "${firstString}" and "${secondString}"`);
    } else {
        console.log("Strings are not equal");
    }
    
  });
}

async function Verify_two_strings_are_not_equal(valueOne, valueTwo) {
  await Verify_two_strings_are_equal();
}

