/*
 * Test Name: 54469 Traveler profile - When the Dynamic Profile Field is long, full text is displayed when hovering over the icon in the title
 * Description: 
 * Status: Active
 * Labels: Profile,Dynamic fields,Regression,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-11-19T08:59:28Z
 * Updated: 2025-07-14T07:23:04Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('felipe@dynamicfields.com');
  await Navigating_to_user_profile();
  await When_the_Dynamic_Profile_Field_is_long__full_text_is_displayed_when_hovering_over_the_icon_in_the_title();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function Navigating_to_user_profile() {
  await waitForText(page, "h1", /Welcome/);
  await page.hover(".passenger-avatar");
  await page.click(".user-profile-link p");
}

async function When_the_Dynamic_Profile_Field_is_long__full_text_is_displayed_when_hovering_over_the_icon_in_the_title() {
  await page.click("[id='tab-personalDetails'] p");
  await waitForText(page, ".name-inputs-container > :nth-child(2) .label", 'First Name');
  await scrollToElement(page, ".reference-fields-container > :nth-child(2) .label");
  await page.hover("[class^='ml'], [class*=' ml']");
  await waitForText(page, ".help", 'huashudshudsahusdhuashuashudsahudashudashudash');
}

