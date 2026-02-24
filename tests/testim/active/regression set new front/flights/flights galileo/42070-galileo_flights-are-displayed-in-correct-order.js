/*
 * Test Name: 42070 Galileo - Flights are displayed in correct order
 * Description: 
 * Status: Active
 * Labels: Regression,Galileo,Flights,progress page,Cancel by process,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-01-18T05:13:21Z
 * Updated: 2026-01-19T07:41:30Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('bsgalileoflight@galileoflight.com');
  await book_a_new_trip();
  await Add_traveler___random_guest();
  await Search_random_flights_round_trip();
  await Flight___Results___Wait_for__Add_to_trip__text();
  await Extracting_values();
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Validating_values_before_booking();
  await Accept_and_proceed_to_checkout();
  await book_and_finalize();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
  await Validating_values_after_booking();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
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

async function Generate_random_first_and_last_name() {
  await page.evaluate(() => {
    //Arrays containing first names and last names
    
    const firstNames = [
    
      "Tyler",
      "Levi",
      "Daniel",
      "David",
      "William",
      "Adam",
      "Alex",
      "Christian",
      "Jacob",
      "Stephan",
      "Elijah",
      "David",
      "Diego",
      "Owen",
      "Ethan",
      "Jaylen",
      "Leandro",
      "Lucas",
      "Damian",
      "Austin",
      "Mateo",
      "Elias",
      // Add more first names here
    
    ];
    
    const lastNames = [
    
      "Sullivan",
      "Green",
      "Lee",
      "Leigh",
      "Diaz",
      "Morgan",
      "Bishop",
      "Pereira",
      "Silva",
      "Quinn",
      "Casey",
      "Reyes",
      "Murray",
      "Dimitriou",
      "Avery",
      "Griffin",
      "Silva",
      "Adams",
      "Kroll",
      "Kohler",
      "Evans",
      "Martin",
      "Hughes",
      // Add more last names here
    
    ];
    
    // Function to generate a random name
    
    function generateRandomFirstName() {
    
      const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    
      exportsTest.randomFN = randomFirstName;
    
    }
    
    function generateRandomLastName() {
    
      const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
      exportsTest.randomLN = randomLastName;
    
    }
    
    // Example usage
    
    const randomFName = generateRandomFirstName();
    
    console.log(randomFName);
    
    
    const randomLName = generateRandomLastName();
    
    console.log(randomLName);
  });
}

async function Add_traveler___random_guest() {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  if (false) {
    await page.click(".personal-info-container .is-transparent span");
  }
  await page.type("#el-id-9261-947", 'israel');
  await page.click("#el-id-9261-1058 > span");
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter email address']");
  await page.type("[placeholder='Enter email address']", email1 + '@' + 'atriistech.com');
  //TODO Please add an assertion here
await getText(page, "[placeholder='Enter email address']");
  // Converting a 'random-value-generator' step has to be done manually at this time
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.click("[placeholder='Enter phone number']");
  await page.type("[placeholder='Enter phone number']", '222' + "-" + num2 + "-" + num3);
  await page.click(".contact-info-container .el-select__caret");
  await page.click("#el-id-5134-938 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".star-icon", {state: "visible"});
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

async function Search_random_flights_round_trip(ROUTE_SCOPE) {
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

async function Extracting_values() {
  //TODO Please add an assertion here
await getText(page, "[aria-describedby='el-tooltip-1521']");
  //TODO Please add an assertion here
await getText(page, "[aria-describedby='el-tooltip-3785']");
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

async function Validating_values_before_booking() {
  await waitForText(page, "[aria-describedby='el-tooltip-6881']", valueOne);
  await waitForText(page, "[aria-describedby='el-tooltip-8135']", valueTwo);
}

async function Accept__Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Click_Proceed_to_Checkout() {
  if (await getText(page, ".btn-container span") === "'Proceed to Checkout'") {
    await waitForText(page, ".btn-container span", 'Proceed to Checkout');
  }
  await page.click(".btn-container span");
}

async function Accept_and_proceed_to_checkout() {
  await waitForText(page, ".payments-title", 'Trip overview');
  await Accept__Terms___Conditions_();
  await page.waitFor(1000);
  await Click_Proceed_to_Checkout();
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function book_and_finalize() {
  await waitForText(page, "h1", 'Booking details');
  await page.waitFor(3000);
  await page.click("[class^='btn--width'], [class*=' btn--width']");
  await Click_Go_to_Trip();
  await waitForText(page, ".payments-title", 'Trip overview');
}

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Validating_values_after_booking() {
  await waitForText(page, "[aria-describedby='el-tooltip-9343']", valueOne);
  await waitForText(page, "[aria-describedby='el-tooltip-4245']", valueTwo);
}

