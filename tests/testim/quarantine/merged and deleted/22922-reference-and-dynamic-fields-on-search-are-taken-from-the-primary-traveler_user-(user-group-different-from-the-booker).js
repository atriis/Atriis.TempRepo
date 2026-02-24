/*
 * Test Name: 22922 reference and dynamic fields on search are taken from the primary traveler - user (user group different from the booker)
 * Description: reference & dynamic fields on search pop up determined by primary traveler. in this test the primary is a user (different from the booker) - fields + content + editable + mandatory
 * Status: Quarantine
 * Labels: Fit for Prod
 * Owner: Shani Hadar
 * Created: 2023-02-01T02:54:59Z
 * Updated: 2024-02-11T07:05:22Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('pini');
  await add_second_traveler_by_name___primary('gadi');
  await Search_for_hotel_1_night('London');
  await validate_fields();
  await validate_content();
  await validate_noneditable();
  await validate_mandatory();
  await validate_can_proceed();
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function refresh_tab() {
  await page.reload();
}

async function refresh_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await refresh_tab();
}

async function add_second_traveler_by_name___primary(name) {
  await page.waitFor(500);
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("body > :nth-child(16) .el-checkbox__inner");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click("h2");
  if (false) {
    await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  }
  if (false) {
    // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
  }
  await page.waitFor(2000);
  await refresh_if_there_is_no_star();
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

async function validate_fields() {
  await waitForText(page, "[id='el-collapse-content-4753'] .label", '*      Type of Trip      info');
  await waitForText(page, "[id='el-collapse-content-9289'] .general-questions > :nth-child(1) .label", 'Type of traveller      info');
  await waitForText(page, "[id='el-collapse-content-9289'] .general-questions > :nth-child(2) .label", '*      Location travel policy      info');
  await waitForText(page, ".input-textbox .label", 'Personnel number      info');
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_content() {
  await waitForText(page, "[name='Soort reis/Type of trip']", '');
  await waitForText(page, "[name='Type of traveller']", 'External employee');
  await waitForText(page, "[name='Location travel policy']", 'Netherlands');
  await waitForText(page, ".input-textbox [type='text']", '');
}

async function validate_noneditable() {
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
  // Converting a 'html-attr-validation' step has to be done manually at this time
}

async function validate_mandatory() {
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".help", 'This field is required');
}

async function validate_can_proceed() {
  await page.click("[name='Soort reis/Type of trip']");
  await page.click("[x-placement='bottom-start'] .el-scrollbar__view > li:nth-of-type(2) span");
  await page.click("body > :nth-child(13) .btn--primary");
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
}

