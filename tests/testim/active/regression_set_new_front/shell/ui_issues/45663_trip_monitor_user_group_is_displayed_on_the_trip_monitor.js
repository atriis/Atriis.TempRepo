/*
 * Test Name: 45663 Trip monitor - User group is displayed on the trip monitor
 * Description: 
 * Status: Active
 * Labels: Regression,Trip monitor,UI,user group,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-05-06T08:11:21Z
 * Updated: 2025-12-16T09:58:45Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await User_group_is_displayed_on_the_trip_monitor();
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

async function User_group_is_displayed_on_the_trip_monitor() {
  await waitForText(page, "h1", /Welcome/);
  await page.click("[title='Trips'] .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] .is-align-items-center", /Found/);
  await page.click("[id='tab-intravel-trips'] p");
  await waitForText(page, "[id='pane-intravel-trips'] .trip-list > :nth-child(1) .booker-consultant-container > :nth-child(1) span", 'Group');
}

