/*
 * Test Name: 21161 move locations via map view
 * Description: Hotels results page- move locations via map view
 * Status: Draft
 * Labels: 
 * Owner: pini harush
 * Created: 2023-01-15T01:24:26Z
 * Updated: 2023-04-04T07:00:25Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await LOG_IN('test@io.com');
  await book_a_new_trip();
  await add_traveler___I_am_the_traveler();
  await Search_for_hotel_1_night('London');
  await waitForText(page, ".view-map-btn", 'View on map');
  await page.click(".view-map-btn");
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(116) .hotel-dot");
  //TODO Please add an assertion here
await getText(page, "[element-loading-text='We\'re on it! Your search request is being processed and your results will be ready soon'] .ellipsis-txt");
  await page.click("[alt='Treehouse Hotel London']");
  //TODO Please add an assertion here
await getText(page, "h1");
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(177) .hotel-dot");
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(34) .hotel-dot");
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(86) .hotel-dot");
  // Converting a 'drag' step has to be done manually at this time
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(32) .hotel-dot");
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(40) .amount");
  // Converting a 'drag' step has to be done manually at this time
  // Converting a 'drag' step has to be done manually at this time
  await page.click("[aria-label='Zoom out']");
  await page.click("[aria-label='Zoom out']");
  await page.click("[aria-label='Zoom out']");
  await page.click("[aria-label='Map'] > :nth-child(2) > :nth-child(1) > :nth-child(3) > :nth-child(316) .hotel-dot");
  await page.click(".close-map-btn .material-symbols-outlined");
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
async function LOG_IN(username) {
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

