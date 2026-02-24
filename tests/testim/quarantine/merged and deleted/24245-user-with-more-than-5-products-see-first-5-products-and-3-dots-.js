/*
 * Test Name: 24245 user with more than 5 products see first 5 products and 3 dots 
 * Description: user with more than 5 products see first 5 products and 3 dots.
rail - with dropdown.
click on every product opens its search page
 * Status: Quarantine
 * Labels: 
 * Owner: Shani Hadar
 * Created: 2023-06-04T01:56:08Z
 * Updated: 2023-09-28T12:23:36Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('Phebe@Produkski.com');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(1) .icon-text");
  await waitForText(page, "#pane-flight > h4", 'Find flights for your trip');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(2) .icon-text");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(3) .icon-text");
  await waitForText(page, "#pane-car > h4", 'Book your car rental');
  await page.click(".product-carousel > :nth-child(2) > :nth-child(5) .icon-text");
  await waitForText(page, "#pane-groundService > h4", 'Book your ground transport');
  await page.hover(".el-icon-arrow-down");
  await page.click("#dropdown-menu-8520 > li:nth-child(1) > span");
  await waitForText(page, "#pane-rails > h4", 'Book Amtrak');
  await page.hover(".el-icon-arrow-down");
  await page.click("#dropdown-menu-8520 > li:nth-child(2) > span");
  await waitForText(page, "#pane-rails > h4", 'Book Heathrow Express in London');
  await page.hover(".el-icon-arrow-down");
  await page.click("#dropdown-menu-8520 > li:nth-child(3) > span");
  await waitForText(page, "#pane-rails > h4", 'Book EU Rail');
  await page.hover(".more-btn .material-symbols-outlined");
  await page.click("#dropdown-menu-9748 > li:nth-child(2) > div > div:nth-child(2)");
  await waitForText(page, "h1", 'Add Manual Quote');
  await page.hover(".more-btn .material-symbols-outlined");
  await page.click("#dropdown-menu-9748 > li:nth-child(1) > div");
  await waitForText(page, "#pane-parking > h4", 'Book your UK parking');
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

