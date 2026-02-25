/*
 * Test Name: 59775 Cars - Different drop off and pick up - Location is updated correctly after edit search
 * Description: 
 * Status: Active
 * Labels: Regression,Cars,results,general,search,Transportation,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-03-24T04:52:09Z
 * Updated: 2025-05-26T02:57:51Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_car_different_pick_up_and_drop_off('Hamburg,Hamburg,Germany,(HAM)', 'Berlin,Germany,(BER)');
  await Car___Results___Wait_for__Select__text();
  await waitForText(page, ".car-vendor-station-list > :nth-child(1) .station-details > :nth-child(2) > :nth-child(1)", /HAMBURG/);
  await Editing_search();
  await Validating_that_location_is_updated_correctly();
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

async function Search_car_different_pick_up_and_drop_off(pickUp, dropOff) {
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

async function Editing_search() {
  await page.click(".edit-search-btn");
  await waitForText(page, ".el-checkbox__label", 'Drop-off at a different location');
  await page.type("#el-id-3154-502", 'San Diego,CA,USA,(SAN)');
  await page.click("#el-id-3154-322-item-0 > div");
  await page.type("#el-id-3154-503", 'New York,NY,USA,(NYC)');
  await page.click(".autocomplete-result");
  await waitForText(page, "#el-id-4569-494", 'San Diego,CA,USA,(SAN)');
  await waitForText(page, "#el-id-4569-495", 'New York,NY,USA,(NYC)');
  await page.click(".btn--size-large");
  await Car___Results___Wait_for__Select__text();
}

async function Validating_that_location_is_updated_correctly() {
  await waitForText(page, ".locations .ellipsis-txt", 'San Diego,CA,USA,(SAN)');
  await waitForText(page, ".car-vendor-station-list > :nth-child(1) .station-details > :nth-child(2) > :nth-child(1)", /SAN DIEGO/);
}

