/*
 * Test Name: 69791 Login with invalid credentials, successful login with valid credentials, and logout validation
 * Description: 
 * Status: Active
 * Labels: Regression,Login Page,Logout,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-11-04T04:12:24Z
 * Updated: 2025-11-04T04:29:54Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimar1anoo@testfail.com');
  await Login_failed();
  await Login_1('ruimariano@amadeus.com');
  await Logging_out();
  await Making_sure_login_page_is_displayed_after_a_couple_seconds();
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
  await page.type("#psw", 'NextLevelAtriis25kk!');
  await page.click("#resetText");
}

async function Login_failed() {
  await waitForText(page, ".text-danger", 'Login failed. Please check your credentials or use your organization\'s login method.');
}

async function Login_1(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function Logout() {
  await page.click(".logout-icon");
}

async function Logging_out() {
  await Logout();
  await waitForText(page, ".welcome", 'You\'ve been logged out successfully!                                Please click here if you are not redirected within a few seconds.');
}

async function Making_sure_login_page_is_displayed_after_a_couple_seconds() {
  await page.waitFor(6000);
  await waitForText(page, "h1", 'Welcome back');
}

