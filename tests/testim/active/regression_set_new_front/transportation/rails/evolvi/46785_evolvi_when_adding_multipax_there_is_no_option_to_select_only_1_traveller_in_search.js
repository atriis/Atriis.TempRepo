/*
 * Test Name: 46785 Evolvi - When adding multipax, there is no option to select only 1 traveller in search
 * Description: 
 * Status: Active
 * Labels: multi pax,multi PTC,Regression,Daily Transportation,Rail,Evolvi,Transportation,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-06-05T07:51:20Z
 * Updated: 2026-02-03T05:36:16Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui-dev.gtp-staging.com");
  await Login('corp@Evolvi.com');
  await book_a_new_trip();
  await Selecting_Evolvi_option_in_search();
  await Add_traveler___I_am_the_traveler();
  await Add_second_traveler___random_guest();
  await add_third_traveller('Fabio Torres');
  await Checking_that_one_traveler_is_not_displayed();
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

async function Selecting_Evolvi_option_in_search() {
  await page.click(".el-select__caret");
  await page.click(".el-select-dropdown__item");
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

async function Add_second_traveler___random_guest() {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click(".add-guest-btn");
  await page.click(".personal-info-container > :nth-child(2) .el-select__caret");
  await page.click("#el-id-1-220 > span");
  await Generate_random_first_and_last_name();
  await page.type("[placeholder='First Name']", randomFN);
  await page.type("[placeholder='Last Name']", randomLN);
  // Converting a 'date-generator' step has to be done manually at this time
  await page.type("[placeholder='DD/MM/YYYY']", birthDate);
  await page.click(".personal-info-container > :nth-child(3) > :nth-child(3)");
  await page.type("#el-id-1-249", 'israel');
  await page.click("#el-id-1-360 > span");
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
  await page.click("#el-id-1-240 > span");
  await page.click(".add-guest-btn");
  await page.waitForSelector(".add-btn .material-symbols-outlined", {state: "visible"});
}

async function add_third_traveller(name) {
  await page.waitFor(2000);
  await page.click("[aria-describedby='el-tooltip-1449']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.click(".user-autocomplete-result");
  await waitForText(page, ".travelers-list > section:nth-of-type(3) .traveler-name", name);
  await page.waitForSelector(".travelers-list > section:nth-of-type(2) .traveler-name", {state: "visible"});
}

async function List_length__with_locator_as_parameter_(length, xpath) {
  await page.evaluate((length, xpath) => {
    const expectedLength = Number(length); // Set your expected number
    
    const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    
    let visibleCount = 0;
    for (let i = 0; i < result.snapshotLength; i++) {
      const el = result.snapshotItem(i);
      if (el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)) {
        visibleCount++;
      }
    }
    
    if (visibleCount === expectedLength) {
      console.log(`Found ${visibleCount} visible elements as expected.`);
    } else {
      throw new Error(`Expected ${expectedLength} visible elements, but found ${visibleCount}.`);
    }
    
  }, length, xpath);
}

async function Checking_that_one_traveler_is_not_displayed() {
  await page.click(".extra-details-container > :nth-child(1) .el-select__caret");
  await waitForText(page, "#el-id-870-119 > span", '3 Traveler');
  await waitForText(page, "#el-id-870-120 > span", '4 Traveler');
  await waitForText(page, "#el-id-870-121 > span", '5 Traveler');
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await List_length__with_locator_as_parameter_("3", "//ul[contains(@class, 'el-select-dropdown__list')]//li[contains(@class, 'el-select-dropdown__item')][.//span[contains(text(), 'Traveler')]]");
}

