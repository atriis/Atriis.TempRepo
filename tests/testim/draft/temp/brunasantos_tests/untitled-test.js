/*
 * Test Name: untitled test
 * Description: 
 * Status: Draft
 * Labels: 
 * Owner: Bruna Santos
 * Created: 2026-01-07T01:33:34Z
 * Updated: 2026-01-07T02:54:19Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('ruimariano@amadeus.com');
  await Book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await Search_flights_round_trip();
  await Flight___Results___Wait_for__Add_to_trip__text();
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

async function Select_random_city_pair() {
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

async function Search_flights_round_trip(ROUTE_SCOPE) {
  await page.click("[id='tab-flight'] p");
  await Select_random_city_pair();
  await page.click("[placeholder='Depart Date']");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(3) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(5) .el-date-table-cell__text");
  await page.click("[id='el-id-3600-671'] > :nth-child(1) .el-radio__label");
  await page.click(".search-btn");
}

async function Flight___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".flight-list > :nth-child(1) .btn--primary", 'Add to trip');
}

