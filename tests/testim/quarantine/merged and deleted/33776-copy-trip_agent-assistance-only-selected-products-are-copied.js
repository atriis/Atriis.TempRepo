/*
 * Test Name: 33776 Copy Trip - Agent Assistance, Only selected products are copied
 * Description: using trip 3295905 (with 3 manual quotes suggested from the agent, one of them added to cart)
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-10-11T08:43:44Z
 * Updated: 2025-07-13T10:15:01Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await page.click("[title='My trips'] .material-symbols-outlined");
  await waitForText(page, "[title='Assistance Requested']", 'Assistance Requested');
  await page.type("[placeholder='Location, trip or travellers']", '3433225');
  await page.waitFor(1000);
  await waitForText(page, ".trip-id", '3433225');
  await page.click(".trip-title");
  await waitForText(page, "#tab-overview > div", 'Overview');
  await page.click("[id='tab-overview'] p");
  await waitForText(page, "[id='pane-overview'] .ticket-details h4", 'London Marriott Hotel County Hall');
  await copy_trip();
  await validations();
  await Trip_Cancelation();
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


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function click_on_copy_trip() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click("#el-id-1344-210 > li:nth-child(2)");
}

async function list_length_validation() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function copy_trip() {
  await click_on_copy_trip();
  await waitForText(page, ".regular-text p", 'The following items will be copied to a new trip');
  await waitForText(page, ".bold-text", 'London Marriott Hotel County Hall');
  await waitForText(page, "[aria-label='Copy trip'] .app-label", 'Pending Booking');
  await list_length_validation();
  await page.click("[aria-label='Copy trip'] .btn--primary");
}

async function validate_number_of_quotes_tab_3() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validate_number_of_quotes_tab_3_1() {
  // Converting a 'validation-code-step' step has to be done manually at this time
}

async function validations() {
  await waitForText(page, ".text--bold", 'Pending booking');
  await waitForText(page, ".box-center h4", 'London Marriott Hotel County Hall');
  await validate_number_of_quotes_tab_3();
  await scrollTo(page, 0, 607);
  await waitForText(page, "[class^='my'], [class*=' my'] [class^='mr'], [class*=' mr']", 'Suggested items');
  await waitForText(page, "[title='London Marriott Hotel County Hall'] h5", 'hotel at London Marriott Hotel County Hall');
  await validate_number_of_quotes_tab_3_1();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

