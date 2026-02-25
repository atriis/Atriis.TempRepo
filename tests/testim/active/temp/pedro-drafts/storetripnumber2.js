/*
 * Test Name: StoreTripNumber2
 * Description: Clone: 
 * Status: Active
 * Labels: temp
 * Owner: Pedro Carneiro
 * Created: 2025-10-17T10:30:44Z
 * Updated: 2025-10-20T06:23:40Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('pmac@bene.ral');
  await Book_a_new_trip();
  await StoreTripNumber_1();
  await StoreTripNumber_1();
  await page.waitFor(10000);
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

async function Book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function getTripId() {
  await page.evaluate(() => {
    const url = window.location.href;
    const match = url.match(/trips\/(\d+)\//);
    
    if (!match) {
      throw new Error("Trip number not found in URL: " + url);
    }
    
    var tripNumber = match[1];
    exportsTest.tripNumber = tripNumber;
    console.log("Trip Number:", tripNumber);
  });
}

async function getUrlTripNumber__add_tab_context_() {
  await getTripId();
}

async function StoreTripNumber() {
  await page.evaluate(() => {
    // Inicializa como const apenas uma vez
    if (!exportsGlobal.trips) {
        const trips = [];
        exportsGlobal.trips = trips;
    }
    
    // Adiciona um novo valor
    exportsGlobal.trips.push(tripNumber);
    
    // Retorna o array atualizado
    return exportsGlobal.trips;
    
  });
}

async function StoreTripNumber_1() {
  await getUrlTripNumber__add_tab_context_();
  await StoreTripNumber();
}

