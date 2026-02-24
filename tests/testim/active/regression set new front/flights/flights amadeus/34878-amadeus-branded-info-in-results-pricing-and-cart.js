/*
 * Test Name: 34878 Amadeus branded info in results, pricing and cart
 * Description: 
 * Status: Active
 * Labels: Regression,No Amadeus Hotel Book,2026 plan 1
 * Owner: pini harush
 * Created: 2023-08-20T02:23:04Z
 * Updated: 2026-01-09T01:07:46Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_random_flights_one_way();
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Flight___Branded_Fares____Flight_details__results_page();
  await Flight___Branded_Fares___Pricing_Options_and__Flight_Details__Options();
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Check_flight_branded_fares___flight_details__cart_();
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
function getText(page, selector) {
  return page.evaluate((selector) => {
    const element = document.querySelector(selector);
    return element.textContent;
  }, selector);
}


// shared steps \\
async function Login(username) {
  await page.type("#email", username);
  await page.type("#psw", 'MAGA!$$2k26');
  await page.click("#resetText");
  await waitForText(page, ".logout-icon", 'logout');
}

async function book_a_new_trip() {
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

async function Fill_in() {
  await page.evaluate(() => {
    /**
     * Search random flights using airport IATA codes only
     * Prevents same-city routes via metro normalization
     * Uses TAB to select the first autocomplete option
     *
     * PARAMETER:
     *  ROUTE_SCOPE (String)
     *    - GENERAL (default)
     *    - US
     *    - EUROPE
     *    - INTERCONTINENTAL
     */
    
    // ---------- ROUTE POOLS (AIRPORTS ONLY) ----------
    const ROUTES = {
      GENERAL: [
        // Europe
        "LHR","LGW","LCY","CDG","ORY","FRA","MUC","AMS","MAD","BCN","FCO","MXP","LIN",
        "ZRH","VIE","BRU","CPH","ARN","OSL","HEL","DUB","LIS","OPO","PRG","BUD","WAW","ATH","IST",
        // North America
        "JFK","EWR","LGA","LAX","SFO","SJC","ORD","MDW","ATL","DFW","DAL","DEN","SEA","MIA","FLL","BOS","IAD","DCA","PHX","LAS",
        // Canada
        "YYZ","YUL","YVR",
        // South America
        "GRU","GIG","EZE","SCL","LIM","BOG",
        // Middle East / Asia
        "DXB","DOH","AUH","HKG","SIN","ICN","NRT","HND","BKK","KUL",
        // Oceania / Africa
        "SYD","MEL","AKL","CAI","JNB"
      ],
    
      US: [
        "JFK","EWR","LGA","LAX","SFO","SAN","SJC","ORD","MDW","ATL",
        "DFW","DAL","IAH","HOU","DEN","SEA","MIA","FLL","BOS","IAD","DCA","PHX","LAS"
      ],
    
      EUROPE: [
        "LHR","LGW","LCY","CDG","ORY","FRA","MUC","AMS","MAD","BCN","FCO",
        "MXP","LIN","ZRH","VIE","BRU","CPH","ARN","OSL","HEL","DUB","LIS","OPO",
        "PRG","BUD","WAW","ATH","IST"
      ],
    
      INTERCONTINENTAL: [
        // Europe ↔ Americas
        "LHR","CDG","FRA","AMS","MAD","FCO",
        "JFK","LAX","SFO","ORD","MIA","YYZ","YUL",
        // Europe ↔ ME / Asia
        "DXB","DOH","AUH","HKG","SIN","ICN","NRT","HND","BKK","KUL",
        // Europe ↔ Oceania
        "SYD","MEL","AKL"
      ]
    };
    
    // ---------- METRO / CITY NORMALIZATION (COVERS ALL ABOVE) ----------
    const CITY_GROUP_BY_AIRPORT = {
      // London
      LHR:"LON", LGW:"LON", LCY:"LON",
      // Paris
      CDG:"PAR", ORY:"PAR",
      // Rome
      FCO:"ROM", CIA:"ROM",
      // Milan
      MXP:"MIL", LIN:"MIL",
      // New York
      JFK:"NYC", EWR:"NYC", LGA:"NYC",
      // Dallas
      DFW:"DAL", DAL:"DAL",
      // Chicago
      ORD:"CHI", MDW:"CHI",
      // Washington DC
      IAD:"WAS", DCA:"WAS",
      // Houston
      IAH:"HOU", HOU:"HOU",
      // Miami
      MIA:"MIA", FLL:"MIA",
      // Bay Area
      SFO:"SFO", SJC:"SFO",
      // Los Angeles area
      LAX:"LAX",
      // Tokyo
      NRT:"TYO", HND:"TYO"
    };
    
    function cityGroup(code) {
      return CITY_GROUP_BY_AIRPORT[code] || code; // fallback: self
    }
    
    // ---------- RESOLVE ROUTE SCOPE ----------
    const scopeRaw = typeof ROUTE_SCOPE === "string" ? ROUTE_SCOPE.trim().toUpperCase() : "GENERAL";
    const ROUTE_SCOPE_RESOLVED = ROUTES[scopeRaw] ? scopeRaw : "GENERAL";
    const IATA_POOL = ROUTES[ROUTE_SCOPE_RESOLVED];
    
    // ---------- RANDOM ROUTE PICKER (NO SAME CITY) ----------
    function pickRandomRoute() {
      const maxAttempts = 50;
      for (let i = 0; i < maxAttempts; i++) {
        const from = IATA_POOL[Math.floor(Math.random() * IATA_POOL.length)];
        const to   = IATA_POOL[Math.floor(Math.random() * IATA_POOL.length)];
        if (from === to) continue;
        if (cityGroup(from) === cityGroup(to)) continue;
        return { from, to };
      }
      throw new Error(`Could not pick a valid route after ${maxAttempts} attempts (${ROUTE_SCOPE_RESOLVED}).`);
    }
    
    // ---------- WAIT FOR AUTOCOMPLETE OPTIONS ----------
    async function waitForFirstOption(timeoutMs = 5000) {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (document.querySelector('li[role="option"]')) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      return false;
    }
    
    // ---------- TYPE IATA + TAB ----------
    async function typeIataAndTab(iata, placeholder) {
      const input = document.querySelector(`input[placeholder="${placeholder}"]`);
      if (!input) throw new Error(`Input not found: ${placeholder}`);
    
      input.focus();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    
      for (const ch of iata) {
        input.value += ch;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise(r => setTimeout(r, 80));
      }
    
      const appeared = await waitForFirstOption();
      if (!appeared) throw new Error(`No autocomplete options for ${iata} (${placeholder})`);
    
      input.dispatchEvent(new KeyboardEvent("keydown", { key:"Tab", code:"Tab", bubbles:true }));
      input.dispatchEvent(new KeyboardEvent("keyup",   { key:"Tab", code:"Tab", bubbles:true }));
    }
    
    // ---------- EXECUTION ----------
    (async () => {
      const route = pickRandomRoute();
      console.log(
        "Route:", route.from, "→", route.to,
        "| groups:", cityGroup(route.from), "→", cityGroup(route.to),
        "| scope:", ROUTE_SCOPE_RESOLVED
      );
    
      await typeIataAndTab(route.from, "From... Departure");
      await typeIataAndTab(route.to,   "To... Destination");
    })();
  });
}

async function Search_random_flights_one_way(ROUTE_SCOPE) {
  await page.click("#tab-flight > div");
  await page.click(".search-options-wrapper > :nth-child(1) [role='radiogroup'] > :nth-child(2) .el-radio__label");
  await Fill_in();
  await page.click("#el-id-383-77");
  await page.click("#el-id-383-63 > div > div.el-picker-panel__body-wrapper > div > div.el-date-picker__header > span.el-date-picker__next-btn > button.el-picker-panel__icon-btn.arrow-right > i > svg > path");
  await page.click("tbody > :nth-child(5) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

async function Flight___Click__Flight_details_() {
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
  await page.click(".flight-list > :nth-child(1) .more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
}

async function Flight___Branded_Fares____Flight_details__results_page() {
  await Flight___Click__Flight_details_();
  await page.click(".flight-details > :nth-child(1) > :nth-child(2) .btn");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("[aria-label='Branded fares'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[aria-label='Flight details'] [xmlns='http://www.w3.org/2000/svg']");
  await waitForText(page, ".flight-list > :nth-child(1) .more-details-btn", 'Flight details');
}

async function Flight___Branded_Fares___Pricing_Options_and__Flight_Details__Options() {
  await page.click(".flight-list > :nth-child(1) .pricing-options");
  await page.waitForSelector(".segment-preview [class^='mr'], [class*=' mr']", {state: "visible"});
  await page.click(".segment-preview .btn");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitForSelector(".flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click(".segment-preview .btn");
  await waitForText(page, ".segment-preview .btn", 'Flight details');
  await page.click(".pricing-options-section > :nth-child(1) .brand-name");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.waitFor(2500);
  await page.click("[aria-label='Pricing Options'] .el-drawer__header [xmlns='http://www.w3.org/2000/svg']");
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

async function Pending_booking___wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function Check_flight_branded_fares___flight_details__cart_() {
  await waitForText(page, ".more-details-btn", 'Flight details');
  await page.click(".more-details-btn");
  await page.waitForSelector(".segment-details-wrapper .ticket-details > :nth-child(1) .flight-details-top-bar .material-symbols-outlined", {state: "visible"});
  await page.click("[class^='m'], [class*=' m']");
  await waitForText(page, "#pane-BASIC\ ECONOMY > section > div:nth-child(2) > h6:nth-child(1)", 'The following ancillaries are included in this brand.');
  await page.click("#el-drawer__title > button > i");
  await page.click("#el-drawer__title > button > i");
  await waitForText(page, ".more-details-btn", 'Flight details');
}

