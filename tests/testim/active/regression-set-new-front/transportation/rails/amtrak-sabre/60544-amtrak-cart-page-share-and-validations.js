/*
 * Test Name: 60544 Amtrak cart page share and validations
 * Description: Amtrak cart page share and validations
 * Status: Active
 * Labels: search,Daily Transportation,Regression,Amtrak Sabre,Transportation,2026 plan 2
 * Owner: pini harush
 * Created: 2025-04-03T12:41:41Z
 * Updated: 2026-01-30T03:08:56Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('bar@amtrak.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Amtrak_search_round_trip('NYP', 'WAS');
  await Trip_reference_fields_after_search();
  await Amtrak___Results___Wait_for__Select__text();
  await page.click(".amtrak-list > :nth-child(1) [hassabreresults='true']");
  await waitForText(page, ".classes-card .mb-4", 'Available Classes And Fares');
  await page.click("[aria-label='More details'] .btn");
  await Amtrak___Results___Wait_for__Select__text();
  await waitForText(page, ".btn--secondary", 'Change');
  await page.click(".amtrak-list > :nth-child(1) .btn--primary");
  await waitForText(page, ".btn--primary", 'Add to trip');
  await page.click(".btn--primary");
  await Pending_Booking___Wait_for_element_text();
  await counter();
  await share_po_and_iti();
  await scrollToElement(page, ".ticket-layout-container .is-clickable");
  await waitForText(page, "[class^='px'], [class*=' px'] p", 'Please add the required extras');
  await page.click(".ticket-layout-container .is-clickable");
  await waitForText(page, ".el-tabs .card-title", 'Contact Information');
  await waitForText(page, ".extras-card [class^='mb'], [class*=' mb']", 'Phone number');
  await waitForText(page, ".carbon > :nth-child(3)", 'CO2');
  await waitForText(page, ".summary-title", /Amtrak Rail to/);
  await page.click(".amtrak-details > :nth-child(1) .btn");
  await waitForText(page, ".rules > :nth-child(1) [class^='mb'], [class*=' mb']", 'Cancellations');
  await page.click("body > :nth-child(28) [fill='currentColor']");
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

async function Amtrak_search_round_trip(fromStation, toStation) {
  await page.click(".el-tabs__header .el-input");
  await page.click("#el-id-3445-21");
  await page.type("[placeholder='From... Station or Location']", fromStation);
  await page.click(".autocomplete-result-text .ellipsis");
  await page.type("[placeholder='To... Station or Location']", toStation);
  await page.click("[id='el-id-4566-49-item-0'] p");
  await page.click("#el-id-1388-375");
  await page.click("[id='el-id-1388-296'] [aria-label='Next Month'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='el-id-1388-296'] tbody > :nth-child(3) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click("#el-id-1388-379");
  await page.click("[id='el-id-1388-331'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".is-paddingless .control");
  await page.click(".search-btn");
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function Click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function Trip_reference_fields_after_search() {
  await page.click(".el-collapse-item__wrap [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-1044-415 > span");
  if (false) {
    await page.type("#el-id-766-703", 'business');
  }
  await Click_on_proceed_after_search();
}

async function Amtrak___Results___Wait_for__Select__text() {
  await waitForText(page, ".amtrak-list > :nth-child(1) .btn--primary", 'Select');
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function counter() {
  //TODO Please add an assertion here
await isVisible(page, ".app-columns .material-symbols-outlined");
  await page.hover(".timed-quote-badge");
}

async function Click_on_share_quote_from_the_cart() {
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-8844 > li:nth-child(1)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function Click_on_share_itinerary_from_cart() {
  await page.hover(".share-icon");
  await page.click("#el-id-3021-171 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
}

async function share_po_and_iti() {
  await Click_on_share_quote_from_the_cart();
  await page.click("body > :nth-child(24) .btn--primary");
  await Success_toast_alert();
  await Click_on_share_itinerary_from_cart();
  await waitForText(page, "body > :nth-child(24) .el-checkbox__label", 'Include PDF');
  await page.click("body > :nth-child(24) .btn--primary");
  await Success_toast_alert();
}

