/*
 * Test Name: 24245 MERGED user with more than 5 products see first 5 products and 3 dots in homepage + privilege can book for yourself and your user group
 * Description: user with more than 5 products see first 5 products and 3 dots.
rail - with dropdown.
click on every product opens its search page
 * Status: Active
 * Labels: Homepage,No Amadeus Hotel Book,Regression,Adding Passengers,Role,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-02-15T06:31:01Z
 * Updated: 2026-02-16T02:05:59Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Pablo@Davidov.com');
  await validates_products_and_links_in_homepage();
  await validate_can_book_for_yourself_and_your_user_group();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function go_to_homepage() {
  await page.click("[title='Home Page'] .material-symbols-outlined");
}

async function validates_products_and_links_in_homepage() {
  await waitForText(page, ".product-carousel > :nth-child(2) > :nth-child(1) .icon-text", 'Flight');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(1) .icon-text");
  await waitForText(page, "#pane-flight > h4", 'Find flights for your trip');
  await go_to_homepage();
  await waitForText(page, ".product-carousel > :nth-child(2) > :nth-child(2) .icon-text", 'Hotel');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(2) .icon-text");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await go_to_homepage();
  await waitForText(page, ".product-carousel > :nth-child(2) > :nth-child(3) .icon-text", 'Car');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(3) .icon-text");
  await waitForText(page, "#pane-car > h4", 'Book your car rental');
  await go_to_homepage();
  await waitForText(page, "[class^='mr'], [class*=' mr']", 'Rail');
  await page.hover("#el-id-2299-991");
  await page.click("#dropdown-menu-8520 > li:nth-child(3) > span");
  await waitForText(page, "#pane-rails > h4", 'Book EU Rail');
  await go_to_homepage();
  await waitForText(page, ".product-carousel > :nth-child(2) > :nth-child(5) .icon-text", 'Transport');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(5) .icon-text");
  await waitForText(page, "#pane-groundService > h4", 'Book your ground transport');
  await go_to_homepage();
  await waitForText(page, ".more-btn .material-symbols-outlined", 'more_horiz');
  await page.hover(".more-btn");
  await page.click("#el-id-3020-997 > li:nth-child(1) > div > span:nth-child(2)");
  await waitForText(page, "#pane-parking > h4", 'Book your UK parking');
  await go_to_homepage();
  await waitForText(page, ".more-btn .material-symbols-outlined", 'more_horiz');
  await page.hover(".more-btn");
  await page.click("#el-id-7875-997 > li:nth-child(2) > div > span:nth-child(2)");
  await waitForText(page, "h1", 'Add Manual Quote');
}

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function validate_can_book_for_yourself_and_your_user_group() {
  await book_a_new_trip();
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await page.click(".traveler-name");
  await waitForText(page, ".autocomplete-title", /Search/);
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'mali cohen');
  await waitForText(page, "h2", 'Mali              Cohen');
  await page.click("h2");
  await waitForText(page, ".traveler-name", 'mali Cohen');
  await page.waitFor(2000);
  await page.click("[aria-describedby='el-tooltip-2499']");
  await waitForText(page, ".has-text-weight-semibold", 'Add traveller');
  await page.click(".has-text-weight-semibold");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'pablo davidov');
  await waitForText(page, "h2", 'Pablo              Davidov');
  await page.click("h2");
  await waitForText(page, ".travelers-list > section:nth-of-type(2) .traveler-name", 'Pablo Davidov');
  await page.click("[aria-describedby='el-tooltip-2165']");
  await waitForText(page, ".has-text-weight-semibold", 'Add traveller');
  await page.click(".has-text-weight-semibold");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'shani cohen');
  await page.waitFor(1000);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await page.click("[aria-label='Add traveller'] > :nth-child(1) .el-dialog__close");
}

