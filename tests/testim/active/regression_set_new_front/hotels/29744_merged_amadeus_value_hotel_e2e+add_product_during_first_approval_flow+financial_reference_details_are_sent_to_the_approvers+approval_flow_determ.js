/*
 * Test Name: 29744 MERGED amadeus value hotel E2E + add product during first approval flow + financial reference details are sent to the approvers + approval flow determined by the financial reference + hybrid for 22090
 * Description: + HYBRID- 
22090 Financial reference code and name are sent in the PNR remarks

+ HYBRID 2-
42717 Missing quotes details in cancel trip email

+ HYBRID 3 - 
47619 remarks for Hotel room type, address, fax, city, postal code
 * Status: Active
 * Labels: Regression,Cars,Hotel,Approval flow,Full Purchase,Financial Reference Code,Email,NL government,Amadeus Value hotel,Amadeus,Pre Prod,Sanity,hybrid,Daily Hotels,66444 hotel results,Transportation,Giata,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2023-11-28T08:39:47Z
 * Updated: 2025-12-08T07:47:37Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await Login('shani@testimcorpnl.com');
  await book_a_new_trip();
  await add_traveler_by_name('segev leshin');
  await add_hotel_and_send_for_approvals();
  await view_approvers_in_trip_overview();
  await validate_approvers();
  await beny_gets_approver_email();
  await beny_gets_approver_email_1();
  await approve_from_beny();
  await page.waitFor(15000);
  await refresh_the_trip_page();
  await refresh_the_trip_page_1();
  await view_approvers_in_trip_overview();
  await validate_approvers_1();
  await olga_gets_approver_email();
  await add_car_and_send_for_approvals();
  await view_approvers_in_trip_overview();
  await validate_approvers_2();
  await beny_gets_update_email();
  await validate_up_to_2_links_in_beny_s_mail();
  await olga_gets_updated_mail_to_approve();
  await approve_the_mail_from_olga();
  await page.waitFor(5000);
  await refresh_the_trip_page_2();
  await view_approvers_in_trip_overview();
  await validate_approvers_3();
  await mali_gets_approver_email();
  await approve_from_mali();
  await page.waitFor(4000);
  await refresh_the_trip_page_3();
  await view_approvers_in_trip_overview();
  await validate_approvers_4();
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

async function book_a_new_trip() {
  await page.waitFor(2000);
  await page.waitFor(1000);
  await page.click(".top-container > :nth-child(4) .material-symbols-outlined");
}

async function add_traveler_by_name(name) {
  await page.click(".add-btn .is-flex");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
  await page.waitForSelector("[alt='loader-22px.gif']", {state: "visible"});
  // Converting a 'wait-for-negative-element-validation' step has to be done manually at this time
}

async function old() {
  if (true) {
    return;
  }
  if (false) {
    await page.type("[placeholder='Check in']", fromdate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check in']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check out']");
  }
  if (false) {
    await page.type("[placeholder='Check out']", todate);
  }
  if (false) {
    await sendSpecialCharacter(page, "[placeholder='Check out']", 'Enter');
  }
  if (false) {
    await page.click("[placeholder='Check in']");
  }
  if (false) {
    await page.click("#el-id-2095-142-item-0 > div");
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
  if (false) {
    // Converting a 'date-generator' step has to be done manually at this time
  }
}

async function Search_hotel_1_night(where) {
  await page.click("[id='tab-hotel'] p");
  await waitForText(page, "#pane-hotel > h4", 'Book and stay at your hotel');
  await page.type("[popperclass='app-autocomplete-popper hotel-autocomplete-popper']", where);
  await page.waitFor(2000);
  await sendSpecialCharacter(page, "#el-id-1869-43", 'Tab');
  await page.click("[placeholder='Check in']");
  await page.click("[id='el-id-5552-138'] .arrow-right");
  await page.click(".el-zoom-in-top-leave-from .arrow-right");
  await page.click(".el-zoom-in-top-enter-from .is-right tbody > :nth-child(4) > td:nth-of-type(3) .el-date-table-cell__text");
  await page.click(".el-zoom-in-top-leave-from .is-right tbody > :nth-child(4) > td:nth-of-type(4) .el-date-table-cell__text");
  await page.click(".search-btn");
  await old();
  if (false) {
    await page.click("[id^='el-autocomplete'] .has-text-weight-bold");
  }
  if (false) {
    await page.waitFor(1000);
  }
}

async function proceed() {
  await waitForText(page, "body > :nth-child(15) .btn--primary", 'Proceed');
  await page.click("body > :nth-child(15) .btn--primary");
}

async function click_on_proceed_after_search() {
  await page.waitFor(1000);
  await proceed();
}

async function loop() {
  if (await getText(page, "[title='Pay at hotel']") === "/Refundable/") {
    await page.click(".app-filter__content > :nth-child(2) [role='group'] > :nth-child(2) .el-checkbox__inner");
  }
}

async function click_refundable_hotel() {
  if (true) {
    return;
  }
  await page.evaluate(() => {
    let refundableRoom=document.querySelector(".refundable.cancellation-terms");
    refundableRoom.parentElement.parentElement.parentElement.parentElement.children[1].firstChild.firstChild.firstChild.children[2].click()
  });
}

async function click_on_procced_if_there_is_a_conflict_with_previous_trip() {
  if (await getText(page, "[class^='mr'], [class*=' mr']") === "/Proceed/") {
    await page.click("[class^='mr'], [class*=' mr']");
  }
}

async function Pending_Booking___Wait_for_element_text() {
  await waitForText(page, ".app-label", 'Pending booking');
}

async function add_hotel_from_search_results_to_cart() {
  await waitForText(page, ".app-distance-slider .filter-name", 'Distance');
  await page.click("[aria-describedby='el-tooltip-372'] .ellipsis-txt");
  await waitForText(page, ".main-layout .check-in .is-size-5", 'Check in');
  await scrollToElement(page, ".app-filter__content > :nth-child(2) .filter-container");
  await loop();
  await scrollToElement(page, ".room-list > :nth-child(21) .ticket-details p");
  await click_refundable_hotel();
  await page.click(".room-list > :nth-child(2) .add-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
  await waitForText(page, ".payments-title", 'Trip overview');
  await Pending_Booking___Wait_for_element_text();
  await waitForText(page, ".ticket-top-section p", 'Refundable');
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

async function select_financial_reference___three_approvers() {
  await page.click(".el-select__caret");
  await page.click(".el-select-dropdown span");
  await page.click("body > :nth-child(11) .btn--primary");
}

async function Price_change_prompt() {
  await page.click("[class^='pt'], [class*=' pt'] .is-flex [class^='m'], [class*=' m']");
}

async function click_on_submit_for_approval() {
  await page.click("[class^='btn--width'], [class*=' btn--width']");
}

async function Click_Go_to_Trip() {
  await waitForText(page, ".btn-container > :nth-child(1)", 'Go to trip');
  await page.click(".btn-container > :nth-child(1)");
}

async function add_hotel_and_send_for_approvals() {
  await Search_hotel_1_night('denver');
  await click_on_proceed_after_search();
  await add_hotel_from_search_results_to_cart();
  await Accept_and_proceed_to_checkout();
  await select_financial_reference___three_approvers();
  await Price_change_prompt();
  await waitForText(page, "#el-collapse-head-7875 > div > span", 'Travellers Reference Questions');
  await click_on_submit_for_approval();
  await waitForText(page, ".success-message__description", 'Your order has been booked and sent to your approver for approval');
  await Click_Go_to_Trip();
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
  await waitForText(page, ".text--bold", 'Confirmed');
  await waitForText(page, ".pnr-code", /PNR/);
}

async function view_approvers_in_trip_overview() {
  await page.hover(".share-btn");
  await page.click(".share-popper > :nth-child(1)");
}

async function validate_approvers() {
  await waitForText(page, ".el-timeline > :nth-child(1) .approver-name", 'Beny cohen');
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, "[id='pane-active-approvers'] .status-desc", /Received request for approval on/);
  await waitForText(page, "[id='pane-active-approvers'] .material-symbols-outlined", 'domain');
  await waitForText(page, ".el-timeline > li:nth-of-type(2) .approver-name", 'Olga Cohen');
  await waitForText(page, ".el-timeline > :nth-child(2) .app-label", 'PENDING');
  await waitForText(page, ".el-timeline > li:nth-of-type(3) .approver-name", 'mali Cohen');
  await waitForText(page, ".el-timeline > :nth-child(3) .app-label", 'PENDING');
  // Converting a 'validation-code-step' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 3 more to go...');
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, ".textAppFlow", 'Nothing approved yet');
  }
  await page.click("body > :nth-child(12) .el-dialog__close");
}

async function beny_gets_approver_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function beny_gets_approver_email_1() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function click_on_a_link_in_the_last_mail(linkNumber) {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function approve_from_beny() {
  await click_on_a_link_in_the_last_mail(4);
}

async function refresh_tab() {
  await page.reload();
}

async function refresh_the_trip_page() {
  await page.waitFor(6000);
  await refresh_tab();
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
}

async function refresh_the_trip_page_1() {
  await page.waitFor(6000);
  await refresh_tab();
  await waitForText(page, "[class^='px'], [class*=' px']", 'Terms & Conditions');
}

async function validate_approvers_1() {
  if (await isVisible(page, ".textAppFlow")) {
    await page.click("[id='tab-active-approvers'] p");
  }
  await waitForText(page, ".el-timeline > :nth-child(1) .approver-name", 'Beny cohen');
  await waitForText(page, ".done", 'DONE');
  await waitForText(page, ".el-timeline > :nth-child(1) .status-desc", /Approved on/);
  await waitForText(page, ".el-timeline > :nth-child(2) .approver-name", 'Olga Cohen');
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, ".el-timeline > :nth-child(2) .status-desc", /Received request for approval on/);
  await waitForText(page, "[id='pane-active-approvers'] .material-symbols-outlined", 'domain');
  await waitForText(page, ".el-timeline > :nth-child(3) .approver-name", 'mali Cohen');
  await waitForText(page, ".pending", 'PENDING');
  // Converting a 'validation-code-step' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 2 more to go...');
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, ".textAppFlow", 'Nothing approved yet');
  }
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function olga_gets_approver_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
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

async function search_car_from_cart() {
  await page.click(".flicking-camera > :nth-child(3) .icon-text");
  await page.click("[valuekey='value']");
  await page.type("[valuekey='value']", 'JFK');
  await page.click("[role='region'] .has-text-weight-bold");
  await page.click("[placeholder='Pick-up Date']");
  await page.click("[aria-label='Next Month']");
  await page.click(".el-date-table tbody > :nth-child(5) > td:nth-of-type(4) span");
  await page.click("[placeholder='Pick-up Time']");
  await page.click("[id='el-id-552-1690'] [class^='mr'], [class*=' mr'] [xmlns='http://www.w3.org/2000/svg']");
  await getTheOpenListIndex();
  await page.click("#el-id-552-2260");
  await page.click(".trip-search-control");
  if (false) {
    await page.click("[id='el-id-7719-71'] .btn-apply");
  }
  if (false) {
    await page.waitFor(1000);
  }
  await page.click("[placeholder='Drop-off Date']");
  await page.click("[id='el-id-5903-290'] tbody > :nth-child(5) > :nth-child(5)");
  await page.waitFor(500);
  await page.click("h3");
  await page.click("#el-id-2437-106");
  await page.click("[id='el-id-552-1725'] [class^='mr'], [class*=' mr'] [fill='currentColor']");
  await getTheOpenListIndex();
  await page.click("#el-id-552-2482");
  await page.click("h3");
  if (false) {
    await page.click("[id='el-id-7719-106'] .btn-apply");
  }
  await page.click(".search-btn");
}

async function Car___Results___Wait_for__Add_to_trip__text() {
  await waitForText(page, ".has-text-black", /Showing/);
  await waitForText(page, ".car-list > :nth-child(1) [class^='btn--width'], [class*=' btn--width']", 'Add to trip');
}

async function add_car_from_results_page_to_cart() {
  await waitForText(page, ".filter-name", 'Price');
  await Car___Results___Wait_for__Add_to_trip__text();
  await page.click(".car-list > :nth-child(1) .desktop-btn");
  await click_on_procced_if_there_is_a_conflict_with_previous_trip();
}

async function add_car_and_send_for_approvals() {
  await search_car_from_cart();
  await add_car_from_results_page_to_cart();
  await Accept_and_proceed_to_checkout();
  await waitForText(page, "#el-collapse-head-7875 > div > span", 'Travellers Reference Questions');
  await click_on_submit_for_approval();
  await Click_Go_to_Trip();
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
}

async function validate_approvers_2() {
  await waitForText(page, ".el-timeline > :nth-child(1) .approver-name", 'Beny cohen');
  await waitForText(page, ".done", 'DONE');
  await waitForText(page, ".el-timeline > :nth-child(1) .status-desc", /Approved on/);
  await waitForText(page, ".el-timeline > :nth-child(2) .approver-name", 'Olga Cohen');
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, ".el-timeline > :nth-child(2) .status-desc", /Received request for approval on/);
  await waitForText(page, "body > :nth-child(12) .hotel", 'domain');
  await waitForText(page, "body > :nth-child(12) .car", 'directions_car');
  await waitForText(page, ".el-timeline > :nth-child(3) .approver-name", 'mali Cohen');
  await waitForText(page, ".pending", 'PENDING');
  // Converting a 'validation-code-step' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 2 more to go...');
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, ".textAppFlow", 'Nothing approved yet');
  }
  await page.click("body > :nth-child(12) .el-dialog__close");
}

async function beny_gets_update_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function validate_up_to_2_links_in_beny_s_mail() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function olga_gets_updated_mail_to_approve() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function approve_the_mail_from_olga() {
  await click_on_a_link_in_the_last_mail(4);
}

async function refresh_the_trip_page_2() {
  await page.waitFor(5000);
  await refresh_tab();
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
}

async function validate_approvers_3() {
  await waitForText(page, ".el-timeline > :nth-child(1) .approver-name", 'Beny cohen');
  await waitForText(page, ".el-timeline > :nth-child(1) .app-label", 'DONE');
  await waitForText(page, ".el-timeline > :nth-child(1) .status-desc", /Approved on/);
  await waitForText(page, ".el-timeline > :nth-child(2) .approver-name", 'Olga Cohen');
  await waitForText(page, ".el-timeline > :nth-child(2) .app-label", 'DONE');
  await waitForText(page, ".el-timeline > :nth-child(2) .status-desc", /Approved on/);
  await waitForText(page, ".el-timeline > :nth-child(3) .approver-name", 'mali Cohen');
  await waitForText(page, "body > :nth-child(12) .hotel", 'domain');
  await waitForText(page, "body > :nth-child(12) .car", 'directions_car');
  await waitForText(page, ".active", 'ACTIVE');
  await waitForText(page, ".el-timeline > :nth-child(3) .status-desc", /Received request for approval on/);
  // Converting a 'validation-code-step' step has to be done manually at this time
  // Converting a 'negative-element-validation' step has to be done manually at this time
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", 'access_time       Approval is in progress, 1 more to go...');
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, ".textAppFlow", 'Nothing approved yet');
  }
  await page.click("body > :nth-child(12) .el-dialog__close");
}

async function mali_gets_approver_email() {
  // Converting a 'email-validation-step' step has to be done manually at this time
}

async function approve_from_mali() {
  await click_on_a_link_in_the_last_mail(4);
}

async function refresh_the_trip_page_3() {
  await page.waitFor(4000);
  await refresh_tab();
  await waitForText(page, ".car-quote-card .more-details .is-flex", /More details/);
}

async function validate_approvers_4() {
  if (false) {
    await waitForText(page, "#pane-active-approvers > div", 'No active approval flow');
  }
  if (false) {
    await waitForText(page, ".btns-container .is-align-items-center", /Approved/);
  }
  if (false) {
    await page.click("[id='tab-approved-approvers'] p");
  }
  if (false) {
    await waitForText(page, "body > :nth-child(13) .hotel", 'domain');
  }
  if (false) {
    await waitForText(page, "[id='pane-approved-approvers'] .step-container > :nth-child(1) > :nth-child(1) .status-desc", /Approved on/);
  }
  if (false) {
    await waitForText(page, "#pane-approved-approvers > div > div > div > div:nth-child(1) > div:nth-child(2)", 'Approved by:Beny cohen ,Olga Cohen ,mali Cohen ');
  }
  if (false) {
    await waitForText(page, "body > :nth-child(13) .car", 'directions_car');
  }
  if (false) {
    await waitForText(page, "[id='pane-approved-approvers'] .step-container > :nth-child(1) > :nth-child(2) .status-desc", /Approved on/);
  }
  if (false) {
    await waitForText(page, "#pane-approved-approvers > div > div > div > div:nth-child(2) > div:nth-child(2)", 'Approved by:Beny cohen ,Olga Cohen ,mali Cohen ');
  }
  await waitForText(page, ".el-dialog__title", 'Trip approval');
  await waitForText(page, ".status-desc", 'No pending items - you\'re up to date.');
  await waitForText(page, "body > :nth-child(20) .sub-title", 'Approval history');
  await waitForText(page, "#el-collapse-head-88 > p", /Approved on/);
  // Converting a 'validation-code-step' step has to be done manually at this time
  await page.click("#el-collapse-head-88 > p");
  await waitForText(page, "body > :nth-child(20) .hotel", 'domain');
  await waitForText(page, "body > :nth-child(20) .car", 'directions_car');
  await waitForText(page, "[id='el-collapse-content-88'] .small-title", 'Approved by:');
  await waitForText(page, ".approvers-list-wrapper .is-flex", 'Beny cohen /Olga Cohen /mali Cohen');
  await page.click("body > :nth-child(13) .el-dialog__close");
}

async function Trip_Cancelation() {
  await page.hover(".dropdowns-container .expand-icon");
  await page.click(".share-popper > :nth-child(2)");
  await waitForText(page, "[aria-label='Trip cancellation'] .el-dialog__title", /Trip cancellation/);
  await page.waitFor(3000);
  await page.click(".btn--primary");
  await waitForText(page, ".msg-description", 'Your trip has been successfully cancelled');
}

