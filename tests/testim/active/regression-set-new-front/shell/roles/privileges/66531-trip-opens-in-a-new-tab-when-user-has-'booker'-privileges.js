/*
 * Test Name: 66531 Trip opens in a new tab when user has 'Booker' privileges
 * Description: 
 * Status: Active
 * Labels: traveler,Regression,Privileges,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-09-05T05:21:41Z
 * Updated: 2025-10-28T02:18:03Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await Navigate_to__Trips_();
  await Navigate_to_a_trip();
  await Trip_does_not_open_in_the_same_tab_when_user_has__Traveller__privileges();
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

async function Navigate_to__Trips_() {
  await waitForText(page, ".trips-title .trips-subtitle", 'How would you like to start your next trip?');
  await page.click(".top-container > :nth-child(5) .material-symbols-outlined");
  await waitForText(page, "[id='pane-upcoming-trips'] [class^='is-flex-gap'], [class*=' is-flex-gap']", /Found/);
}

async function Navigate_to_a_trip() {
  await waitForText(page, ".trip-list > :nth-child(1) .trip-title", /Trip/);
  await page.click("[id='tab-intravel-trips'] p");
  await page.click(".trip-list > :nth-child(1) .app-label");
}

async function Trip_does_not_open_in_the_same_tab_when_user_has__Traveller__privileges() {
  await waitForText(page, "#tab-overview > div", 'Overview');
}

