/*
 * Test Name: 47193 Manual quote - Flight manual quote is sent for approval successfully
 * Description: 
 * Status: Active
 * Labels: Regression,Manual Quote,Flights,Approval flow,2026 plan 1
 * Owner: Bruna Santos
 * Created: 2024-06-14T09:11:53Z
 * Updated: 2025-10-21T11:18:05Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await Add_traveler___random_guest();
  await add_manual_quote_flight_one_way_LON_MAD();
  await Flight_manual_quote_is_sent_for_approval_successfully();
  await Click_Go_to_Trip();
  await Flights___Trip_Overview___Wait_for__Flight_details__text_display();
  await Trip_Cancelation___warning_and_continue();
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

async function getTheOpenListIndex(element) {
  await page.evaluate((element) => {
    // Get the index of the currently visible (open) dropdown popper
    function getOpenDropdownIndex() {
        // 1. Select ALL dropdown popper containers using a common class.
        const allPoppers = document.querySelectorAll('.el-popper');
    
        // 2. Iterate through the collection to find the open one.
        for (let i = 0; i < allPoppers.length; i++) {
            const popper = allPoppers[i];
            
            // Get the value of the style attribute. If null, treat it as an empty string.
            const style = popper.getAttribute('style') || '';
    
            // 3. Check for the definitive "open" state: the style attribute MUST NOT contain "display: none".
            // This is more reliable than aria-hidden for visual visibility.
            if (!style.includes('display: none')) {
                
                // Return the 1-based index (i + 1)
                return i + 1;
            }
        }
    
        // Return 0 if no dropdown is currently found to be open/visible.
        return 0;
    }
    
    // Example of how to call the function and use the result
    const openIndex = getOpenDropdownIndex();
    
    // Log the result (or return it as a step output variable in your automation tool)
    console.log("The 1-based index of the open dropdown is:", openIndex);
    
    exportsTest.index = openIndex
    
    // return openIndex; // Uncomment this line if your automation tool requires a return value
  }, element);
}

async function add_manual_quote_flight_one_way_LON_MAD() {
  await page.click(".is-capitalized");
  await waitForText(page, ".flight-number", 'Flight 1');
  await page.type("#el-id-1095-4118", 'lon');
  await page.click("[id='el-id-1095-3383-item-0'] .ellipsis");
  await page.click("#el-id-1095-3386");
  await page.click("[id='el-id-7956-3351'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex(".trip-app > :nth-child(1)");
  await page.click("[id^='el-id'] span");
  await page.click(".page-view .is-align-items-end");
  if (false) {
    await page.click("[id='el-id-1095-3387'] .btn-apply");
  }
  await page.type("#el-id-1095-4123", 'mad');
  await page.click("[id='el-id-1095-3477-item-0'] .has-text-weight-bold");
  await page.click("#el-id-1095-3480");
  await page.click("[id='el-id-472-3433'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex(".page-view > :nth-child(1)");
  await page.click(".is-focused [xmlns='http://www.w3.org/2000/svg']");
  await page.click("[id='pane-flight'] h4");
  if (false) {
    await page.click("[id='el-id-7704-2568'] [name='minutes'] svg");
  }
  if (false) {
    await page.click("#el-id-7704-2587 > span");
  }
  if (false) {
    await page.click("[id^='el-id-1095-3481'] .btn-apply");
  }
  // Converting a 'date-generator' step has to be done manually at this time
  await page.click("#el-id-1095-4119");
  await page.click("[id='el-id-1095-3385'] [aria-label='Next Month'] svg");
  await page.click("[id='el-id-1095-3385'] tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  if (false) {
    await page.type(".manual-quote-flight-segment > :nth-child(2) [placeholder='DD MM YYYY']", dateFromFlight);
  }
  await page.type("#el-id-1095-4128", '1235');
  await page.type("#el-id-1095-4132", 'rewq23');
  await page.type("#el-id-1095-4133", 'el al');
  await page.click("#el-id-1095-3779 > span");
  await page.type("#el-id-1095-3378", '1');
  await page.type("[name='tax']", '20');
  await page.type("#el-id-1077-2584", '5');
  await page.waitFor(2000);
  await page.click(".add-quote-btn");
}

async function Trip_reference_questions() {
  if (await getText(page, ".el-dialog__title") !== "'Trip Reference Form'") {
    return;
  }
  await page.click("[id='el-collapse-content-4336'] [xmlns='http://www.w3.org/2000/svg']");
  await page.click("#el-id-4735-4343");
  await page.click("body > :nth-child(19) .btn--primary");
}

async function On_Hold___Wait_for_element_text() {
  await waitForText(page, ".app-label--quote", 'On hold');
}

async function select_first_financial_reference() {
  await page.waitFor(3000);
  await waitForText(page, ".is-capitalized", 'Financial Reference');
  await page.click(".el-select__caret");
  await page.click(".el-select-dropdown span");
  await page.click("body > :nth-child(11) .btn--primary");
}

async function Flight_manual_quote_is_sent_for_approval_successfully() {
  await page.waitFor(2000);
  await Trip_reference_questions();
  await On_Hold___Wait_for_element_text();
  await page.click(".btn-container span");
  await page.waitFor(6000);
  await select_first_financial_reference();
  await waitForText(page, ".contact-details-container [class^='is-size'], [class*=' is-size']", 'Contact details');
  await page.waitFor(3000);
  await page.click(".is-hidden-mobile");
  await waitForText(page, ".success-message__description", 'Your order has been booked and sent to your approver for approval');
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function Flights___Trip_Overview___Wait_for__Flight_details__text_display() {
  await waitForText(page, ".more-details-btn", 'Flight details');
}

async function Trip_Cancelation___warning_and_continue() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(500);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

