/*
 * Test Name: 24244 homepage - user with 3-5 products see all the products
 * Description: user with 3-5 products see all the products in the homepage. click on every product opens its search page
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-02-07T09:52:47Z
 * Updated: 2024-02-01T11:55:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Threve@prod.com');
  await waitForText(page, ".flicking-camera > :nth-child(1) > :nth-child(1) .icon-text", 'Hotel');
  await waitForText(page, ".flicking-camera > :nth-child(1) > :nth-child(2) .icon-text", 'Car');
  await waitForText(page, "[class^='mr'], [class*=' mr']", 'Rail');
  await waitForText(page, ".flicking-camera > :nth-child(1) > :nth-child(4) .icon-text", 'Parking');
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(1) .icon-text");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.click("[title='Home Page'] .material-symbols-outlined");
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(2) .icon-text");
  await waitForText(page, "#pane-car > h4", 'Book your car rental');
  await page.click(".el-icon-arrow-down");
  await page.hover(".el-button");
  await page.click(".el-dropdown-menu span");
  await waitForText(page, "#pane-rails > h4", 'Book EU Rail');
  await page.click(".flicking-camera > :nth-child(1) > :nth-child(4) .icon-text");
  await waitForText(page, "#pane-parking > h4", 'Book your UK parking');
  await page.hover(".el-button");
  await page.click(".el-dropdown-menu > li:nth-of-type(1) span");
  await waitForText(page, "#pane-rails > h4", 'Book Heathrow Express in London');
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

