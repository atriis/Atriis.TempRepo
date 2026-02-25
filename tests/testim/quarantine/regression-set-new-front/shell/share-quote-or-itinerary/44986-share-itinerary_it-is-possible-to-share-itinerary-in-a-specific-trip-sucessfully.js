/*
 * Test Name: 44986 Share itinerary - It is possible to share itinerary in a specific trip sucessfully
 * Description: 
 * Status: Quarantine
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2024-04-22T07:48:45Z
 * Updated: 2024-08-06T02:31:34Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('JSKRL@JSKRL.com');
  await waitForText(page, ".marginEightee > div:nth-of-type(2) span", 'How would you like to start your next trip');
  await page.goto('https://ui.gtp-staging.com/trips/3348535/cart');
  await waitForText(page, "[aria-describedby='el-tooltip-8304']", 'Pending booking');
  await page.hover(".share-icon");
  await page.click("#dropdown-menu-4995 > li:nth-child(2)");
  await waitForText(page, ".share-quotes-form > :nth-child(3) .label", 'Subject');
  await page.click("body > :nth-child(14) .btn--primary");
  await waitForText(page, ".el-notification__title", 'Success');
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

