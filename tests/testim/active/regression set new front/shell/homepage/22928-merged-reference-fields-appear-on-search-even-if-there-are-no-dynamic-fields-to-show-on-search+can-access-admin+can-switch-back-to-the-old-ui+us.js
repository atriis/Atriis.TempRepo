/*
 * Test Name: 22928 MERGED reference fields appear on search even if there are no dynamic fields to show on search + can access admin + can switch back to the old UI + user with 3-5 products can see all products on homepage
 * Description: pop up with refrence fields appear on search even if there are no dynamic fields 
 * Status: Active
 * Labels: NL government,Reference Fields,No Amadeus Hotel Book,Homepage,Products,Regression,Administration,Switching to Old Interface,UI,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-01T11:01:36Z
 * Updated: 2026-02-16T02:12:25Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('rafi@testim.com');
  await validate_homepage_with_3_5_products();
  await validate_reference_fields_on_search();
  await validate_can_access_admin();
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


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function validate_homepage_with_3_5_products() {
  await waitForText(page, ".flicking-camera > :nth-child(1) > :nth-child(1) .icon-text", 'Hotel');
  await waitForText(page, ".flicking-camera > :nth-child(1) > :nth-child(2) .icon-text", 'Car');
  await waitForText(page, "[class^='mr'], [class*=' mr']", 'Rail');
  await waitForText(page, ".flicking-camera > :nth-child(1) > :nth-child(4) .icon-text", 'Parking');
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(1) .icon-text");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.click("[title='Home Page'] .material-symbols-outlined");
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(2) .icon-text");
  await waitForText(page, "#pane-car > h4", 'Book your car rental');
  await page.hover("#el-id-7806-6");
  await page.click(".el-dropdown-menu span");
  await waitForText(page, "#pane-rails > h4", 'Book EU Rail');
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(4) .icon-text");
  await waitForText(page, "#pane-parking > h4", 'Book your UK parking');
  await close_tab___choose_relevant_tab_in_context();
  await close_tab___choose_relevant_tab_in_context();
  await close_tab___choose_relevant_tab_in_context();
  await close_tab___choose_relevant_tab_in_context();
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

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_for_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function validate_reference_fields_on_search() {
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_for_hotel_1_night('London');
  // Converting a 'validation-code-step' step has to be done manually at this time
  await waitForText(page, ".label > :nth-child(2)", /type of trip/);
  await waitForText(page, ".form-select span", 'Select');
  await page.click(".el-collapse-item__wrap [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4379-341 > span");
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
}

async function validate_can_access_admin() {
  await page.click("[to='/'] .material-symbols-outlined");
  await waitForText(page, "[title='Justifications Table']", /Justifications/);
}

