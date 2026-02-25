/*
 * Test Name: 28941 AA NDC - Seats - Preferred and extra legroom seats are green and show 'Extra legroom' in the tooltip
 * Description: 
 * Status: Active
 * Labels: AA NDC Regression,Flights,Seating,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2025-07-15T10:41:50Z
 * Updated: 2025-12-15T12:12:44Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ami@rickan.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_one_way('NYC', 'MIA');
  await Add_flight_from_results_page_to_cart();
  await Pending_Booking___Wait_for_element_text();
  await Clicking_to_open_seats();
  await tst();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function isVisible(page, selector) {
  try {
    const elementHandle = await page.$(selector);
    if(!elementHandle) {
      return false;
    }
    const elementBox = await elementHandle.boundingBox();
    return Boolean(elementBox);
  } catch(err) {
    return false;
  }
}
async function sendSpecialCharacter(page, selector, key) {
  const elementHandle = await page.$(selector);
  await elementHandle.press(key);
}

function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
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

async function Book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function refresh_tab_if_there_is_no_star() {
  if (await isVisible(page, ".star-icon")) {
    return;
  }
  await page.reload();
}

async function Add_traveler___I_am_the_traveler() {
  await waitForText(page, ".imt-btn", 'Add me');
  await page.click(".imt-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
  await refresh_tab_if_there_is_no_star();
}

async function old() {
  if (true) {
    return;
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("[placeholder='Departure date']");
  await page.type("[placeholder='Departure date']", departureDate);
  await sendSpecialCharacter(page, "[placeholder='Departure date']", 'Enter');
}

async function Search_flights_one_way(from, to) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await page.type("[placeholder='From... Departure']", from);
  await sendSpecialCharacter(page, "#el-id-4533-79", 'Tab');
  await page.type("[placeholder='To... Destination']", to);
  await sendSpecialCharacter(page, "#el-id-4533-80", 'Tab');
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await old();
  await page.click(".search-btn");
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Add_flight_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await page.click(".flight-list > :nth-child(2) .btn--primary");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Clicking_to_open_seats() {
  await scrollToElement(page, ".flight-seating .card-title");
  await waitForText(page, ".flight-seating .card-title", 'Seating');
  await page.click(".flight-seating .is-clickable");
  await waitForText(page, ".muliBold", 'Add Seats');
  await page.click(".muliBold");
}

async function kkk() {
  await page.evaluate(() => {
    // Flexible green checker with tolerance
    function isRoughlyGreen(rgbString) {
      const match = rgbString.match(/\d+/g);
      if (!match || match.length < 3) return false;
    
      const [r, g, b] = match.map(Number);
    
      // Define a range around your expected green (135, 198, 134)
      return (
        r >= 120 && r <= 150 &&
        g >= 190 && g <= 210 &&
        b >= 120 && b <= 150
      );
    }
    
    // Find all seat elements
    const seatElements = Array.from(document.querySelectorAll('.plane-seat.preferred.extra-leg-room.el-tooltip__trigger'));
    
    // Initialize eligible seats array
    const eligibleSeats = [];
    
    // Iterate and filter
    seatElements.forEach(seatElement => {
      const spanElement = seatElement.querySelector('span');
    
      if (spanElement && /[$€£]/.test(spanElement.textContent)) {
        const color = getComputedStyle(seatElement).backgroundColor; // Note: background-color is more appropriate here
        console.log('Seat background color:', color);
    
        if (isRoughlyGreen(color)) {
          eligibleSeats.push(seatElement);
        }
      }
    });
    
    // Select a random one if available
    if (eligibleSeats.length > 0) {
      const randomIndex = Math.floor(Math.random() * eligibleSeats.length);
      const selectedSeat = eligibleSeats[randomIndex];
    
      console.log('Clicking green seat:', selectedSeat);
      selectedSeat.scrollIntoView({ behavior: 'smooth' });
      selectedSeat.click();
    } else {
      throw new Error('No eligible green-colored seats found with $, €, or £.');
    }
    
  });
}

async function kk() {
  await page.evaluate(() => {
    const expectedTexts = ['Preferred Seat', 'Extra legroom Seat'];
    
    const tooltips = Array.from(document.querySelectorAll('.el-popper.is-light[aria-hidden="false"]'));
    
    const matchFound = tooltips.some(tooltip => {
      const text = tooltip.innerText || '';
      return expectedTexts.every(expected => text.includes(expected));
    });
    
    if (matchFound) {
      console.log('Tooltip found containing both Preferred Seat and Extra legroom Seat');
    } else {
      throw new Error('No tooltip found containing both Preferred Seat and Extra legroom Seat');
    }
    
  });
}

async function tst() {
  await waitForText(page, ".flight-passengers .btn", 'Reset');
  await kkk();
  await kk();
}

