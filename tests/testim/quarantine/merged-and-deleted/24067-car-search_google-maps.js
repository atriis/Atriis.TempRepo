/*
 * Test Name: 24067 Car search - Google maps
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Noam Miller
 * Created: 2023-07-31T10:43:16Z
 * Updated: 2024-01-02T12:15:49Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('testim@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_car_with_agency('Avis');
  await Click_location_link_in_results();
  await Validate_location_on_Google_Maps();
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

async function Search_car_with_agency(Company) {
  await page.click("#tab-car > div");
  await page.click("[placeholder='Airport, City or Address']");
  await page.type("[placeholder='Airport, City or Address']", 'Austin');
  await page.click("[id='el-autocomplete-9966-item-0'] .ellipsis");
  await page.click("[placeholder='Pick-up Date']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(4) > td:nth-of-type(3) span");
  await page.click("[placeholder='Pick-up Time']");
  await page.type("[placeholder='Pick-up Time']", '11:00');
  await sendSpecialCharacter(page, "[placeholder='Pick-up Time']", 'Enter');
  await page.click("[placeholder='Drop-off Date']");
  await page.click("[x-placement='bottom-start'] .el-date-table tbody > :nth-child(4) > td:nth-of-type(5) span");
  await page.click("[placeholder='Drop-off Time']");
  await page.type("[placeholder='Drop-off Time']", '11:00');
  await sendSpecialCharacter(page, "[placeholder='Drop-off Time']", 'Enter');
  await page.click("[placeholder='Rental agency']");
  await page.type("[placeholder='Rental agency']", Company);
  await page.click(".car-rental-select .el-scrollbar__view > li:nth-of-type(34) span");
  await page.click(".search-btn");
  await waitForText(page, ".car-vendor-station-list > :nth-child(1) .add-btn", 'Select');
  await page.click(".car-vendor-station-list > :nth-child(2) .add-btn");
}

async function Click_location_link_in_results() {
  await waitForText(page, ".car-list > :nth-child(1) .desktop-btn", 'Add to trip');
  //TODO Please add an assertion here
await getText(page, ".car-list > :nth-child(1) .car-addresses > :nth-child(1) [target='_blank']");
  await page.click(".car-list > :nth-child(1) .car-addresses > :nth-child(1) [target='_blank']");
}

async function Validate_location_on_Google_Maps() {
  await waitForText(page, ".pChizd .R8c4Qb", 'Directions');
  await waitForText(page, "[jslog='36916; mutable:true;'] .DkEaL", new RegExp("^" +location));
}

