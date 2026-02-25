/*
 * Test Name: 58325 Amadeus - Flight - Booking succceds when traveller's name has space or period (".")
 * Description: 
 * Status: Active
 * Labels: Amadeus,Regression,Flights,Full Purchase,traveler,2026 plan 2
 * Owner: Bruna Santos
 * Created: 2025-02-13T07:52:54Z
 * Updated: 2026-02-16T10:02:59Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('brunawatsonnlgov@amadeusspaceperiod.com');
  await book_a_new_trip();
  await Add_random_traveler_with_space();
  await Search_random_flights_one_way();
  await click_on_proceed_after_search___warning_and_continue();
  await Add_flight_from_results_page_to_cart();
  await Pending_booking___wait_for_element_text();
  await Selecting_fop();
  await Fill_free_text_justification_in_cart_if_needed();
  await Click__I_accept_the_Terms___Conditions_();
  await Hold_flight();
  await Trip_Cancelation();
  await browser.close();
})();

// move to utils.js

async function waitForText(page, selector, expectedText) {
  await page.waitForFunction(([selector, expectedText]) => {
    const element = document.querySelector(selector);
    return element && element.textContent.replace(/[\r\n]+/g, "").trim() === expectedText.trim();
  }, [selector, expectedText]);
}

async function scrollTo(page, x, y) {
  await page.evaluate(([x, y]) => {
    window.scroll(x, y);
  }, [x, y]);
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

async function Generate_random_first_and_last_name_with_space() {
  await page.evaluate(() => {
    //Arrays containing first names and last names
    
    const firstNames = [
    
      "Tyler  ",
      "Levi  ",
      "Daniel  ",
      "David  ",
      "William  ",
      "Adam  ",
      "Alex  ",
      "Christian  ",
      "Jacob  ",
      "Stephan  ",
      "Elijah  ",
      "David  ",
      "Diego  ",
      "Owen  ",
      "Ethan  ",
      "Jaylen  ",
      "Leandro  ",
      "Lucas  ",
      "Damian  ",
      "Austin  ",
      "Mateo  ",
      "Elias  ",
    ];
    
    const lastNames = [
      "Carol  Smith",
      "Maria  Green",
      "Lucas  Lee",
      "Emma  Leigh",
      "Sofia  Diaz",
      "James  Morgan",
      "Daniel  Bishop",
      "Ana  Pereira",
      "Joao  Silva",
      "Liam  Quinn",
      "Noah  Casey",
      "Isabel  Reyes",
      "Oliver  Murray",
      "Nikos  Dimitriou",
      "Ava  Avery",
      "Henry  Griffin",
      "Paulo  Silva",
      "Michael  Adams",
      "Sarah  Kroll",
      "Laura  Kohler",
      "Robert  Evans",
      "Victor  Martin",
      "Emily  Hughes",
    
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

async function Add_random_traveler_with_space() {
  await page.click(".has-text-weight-semibold");
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-4809-918 > span");
  await Generate_random_first_and_last_name_with_space();
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

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search___warning_and_continue() {
  await page.waitFor(1000);
  await proceed();
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

async function Selecting_fop() {
  await page.click(".add-form-payment");
  await waitForText(page, ".card-name > :nth-child(1)", /testim bruna/);
  await page.click(".checkbox-round");
  await page.click(".btn-save");
  await waitForText(page, ".fop-owner", /Paid/);
}

async function Fill_free_text_justification_in_cart_if_needed() {
  await scrollTo(page, 0, 493);
  if (await getText(page, ".oop-title") === "'Out of policy'") {
    await page.type("[autocomplete='off']", 'abc');
  }
  await page.waitFor(1000);
  if (await getText(page, ".help") === "'Please save your justification'") {
    await page.click("[id='pane-overview'] .btn");
  }
}

async function Click__I_accept_the_Terms___Conditions_() {
  await page.click(".el-checkbox__inner");
}

async function Price_Change() {
  if (await getText(page, ".muliBold") !== "'Price change'") {
    return;
  }
  await page.click(".app-footer .is-flex-wrap-wrap .btn--primary");
}

async function On() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function Hold_flight() {
  await page.click(".quote-card .btn--default");
  await Price_Change();
  await On();
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

