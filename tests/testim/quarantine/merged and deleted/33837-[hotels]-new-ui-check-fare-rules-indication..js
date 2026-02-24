/*
 * Test Name: 33837 [Hotels] New UI, check fare rules indication.
 * Description: 3 indications for fare rules appear in the room level: 
refundable, non-refundable and check cancellation  policy. 

hotel for example:
1. where = 'gdn'. hotel name ='Hotel Mercure Gdansk Stare Miasto'
2. 

 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-10-24T09:53:15Z
 * Updated: 2023-12-24T09:35:01Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('amos@one.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_hotel_1_night('gdn');
  await page.click("body > :nth-child(14) .btn--primary");
  await page.click("[placeholder='Search hotel']");
  await page.type("[placeholder='Search hotel']", 'Hotel Mercure Gdansk Stare Miasto');
  await page.click(".see-availability-btn");
  await waitForText(page, "#tab-amenities", 'Amenities');
  await define_parameters();
  await scrollTo(page, 0, 800);
  await waitForText(page, ".room-list > div:nth-of-type(1) .no-padding", 'Terms & Conditions');
  await check_all_rooms();
  await new_validation();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function Search_hotel_1_night(where) {
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

async function define_parameters() {
  await page.evaluate(() => {
    exportsTest.refundable = false;
    exportsTest.non_refundable = false;
    exportsTest.cancellation_policy = false;
    
    //console.log("before, non refundable= ",exportsTest.non_refundable);
    //console.log("before, refundable= ",exportsTest.refundable);
    //console.log("before, check cancellation policy= ",exportsTest.cancellation_policy);
    
  });
}

async function update_refundable_parameter_in_case_label_found() {
  if (await getText(page, ".room-list > :nth-child(2) .ticket-details p") !== "/Refundable/") {
    return;
  }
  await page.evaluate(() => {
    exportsTest.refundable = true;
    //console.log("after, refundable= ",exportsTest.refundable);
  });
}

async function update_refundable_parameter() {
  await update_refundable_parameter_in_case_label_found();
}

async function update_non_refundable_parameter_in_case_label_found() {
  if (await getText(page, ".room-list > :nth-child(2) .ticket-details p") !== "/Non-refundable/") {
    return;
  }
  await page.evaluate(() => {
    exportsTest.non_refundable = true;
    //console.log("after, non refundable= ",exportsTest.non_refundable);
  });
}

async function update_non_refundable_parameter() {
  await update_non_refundable_parameter_in_case_label_found();
}

async function update_cancelation_policy_parameter_in_case_label_found() {
  if (await getText(page, ".room-list > :nth-child(2) .ticket-details p") !== "/Check cancelation policy/") {
    return;
  }
  await page.evaluate(() => {
    exportsTest.cancellation_policy = true;
    //console.log("after, check cancellation policy= ",exportsTest.non_refundable);
  });
}

async function update_cancellation_policy_parameter() {
  await update_cancelation_policy_parameter_in_case_label_found();
}

async function check_all_rooms() {
  await waitForText(page, ".room-list > div:nth-of-type(1) .no-padding", 'Terms & Conditions');
  await update_refundable_parameter();
  await update_non_refundable_parameter();
  await update_cancellation_policy_parameter();
}

async function new_validation() {
  await page.evaluate(() => {
    console.log("validation, non refundable= ",non_refundable);
    console.log("validation, refundable= ",refundable);
    console.log("validation, cancellation policy= ",cancellation_policy);
    
    if (!non_refundable) {
            throw new Error("non refundable label is missing");
        }
    if (!refundable) {
            throw new Error("refundable label is missing");
        }
    
    if (!cancellation_policy) {
            throw new Error("check cancellation policy label is missing");
        }
    
    // if all parameters are true -> the test will pass
    //if at least one is false -> the test will fail
  });
}

