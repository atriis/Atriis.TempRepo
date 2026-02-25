/*
 * Test Name: 62892 Sunny Cars - Adding location successfully when searching for different pick up and drop off locations
 * Description: 
 * Status: Active
 * Labels: Cars,SunnyCars Regression,location,Regression,Transportation,2026 plan 2,02
 * Owner: Bruna Santos
 * Created: 2025-06-03T12:22:03Z
 * Updated: 2025-08-19T11:55:43Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login("brunaalice@sunny.com");
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_car_different_pick_up_and_drop_off('LHR', 'LGW');
  await Add_car_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Adding_location_successfully_when_searching_for_different_pick_up_and_drop_off_locations();
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

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Adding_location_successfully_when_searching_for_different_pick_up_and_drop_off_locations() {
  await scrollToElement(page, ".car-sunnycars-add-location .card-title");
  await waitForText(page, ".car-sunnycars-add-location .card-title", 'Add location');
  await page.click(".car-sunnycars-add-location .is-clickable");
  await waitForText(page, ".columns > :nth-child(1) .label", 'Pickup location');
  await page.click(".columns > :nth-child(1) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] span");
  await page.click(".columns > :nth-child(2) [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id*='id'] span");
  await page.click(".el-tabs .btn--primary");
  await Success_toast_alert();
  await scrollToElement(page, ".car-special-equipment .card-title");
  //TODO Please add an assertion here
await isVisible(page, ".car-sunnycars-add-location .material-symbols-outlined");
}

