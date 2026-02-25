/*
 * Test Name: 49858 privileges for view and edit profile and validate gender is mandatory
 * Description: 
 * Status: Active
 * Labels: Regression,Profile,Role,Privileges,2026 plan 1
 * Owner: Shani Hadar
 * Created: 2024-10-31T02:00:12Z
 * Updated: 2026-02-17T06:35:55Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com/");
  await case_1___privilege_can_view_profile_of_other_users();
  await case_1___privilege_can_view_profile_of_other_users_1();
  await case_1___privilege_can_view_profile_of_other_users_2();
  await case_3___privilege_prevent_updating_other_and_own_profile();
  await case_5___validate_can_t_enter_profile_from_link();
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

async function Success_toast_alert() {
  await waitForText(page, ".el-notification__title", 'Success');
}

async function close_tab() {
  await page.evaluate(() => {
    //window.close()
    
    self.close();
    var newWindow = window.open('', '_self');
    newWindow.close();
    window.close()
    window.top.close();
    window.parent.close();
    
  });
}

async function close_tab___choose_relevant_tab_in_context() {
  await close_tab();
}

async function validate_can_edit_profile() {
  await Add_traveler___I_am_the_traveler();
  await waitForText(page, ".traveler-name", 'View Profile');
  await page.click(".traveler-name");
  await waitForText(page, "#el-id-3193-34", 'View');
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("#el-id-5027-35", middle1);
  await page.waitFor(2000);
  await page.click(".btn--primary");
  await Success_toast_alert();
  await page.waitFor(2000);
  await waitForText(page, "#el-id-5027-35", middle1);
  await close_tab___choose_relevant_tab_in_context();
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

async function validate_can_see_but_can_t_edit_profile_of_others() {
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await add_traveler_by_name('edit');
  await waitForText(page, ".traveler-name", 'Edit Profile');
  await page.click(".traveler-name");
  await page.waitFor(2000);
  await waitForText(page, ".user-profile-title p", 'Your profile settings');
  await page.waitFor(2000);
  await scrollTo(page, 0, 32);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await close_tab___choose_relevant_tab_in_context();
}

async function Logout() {
  await page.click(".logout-icon");
}

async function case_1___privilege_can_view_profile_of_other_users() {
  await Login('View@profile.com');
  await book_a_new_trip();
  await validate_can_edit_profile();
  await validate_can_see_but_can_t_edit_profile_of_others();
  await close_tab___choose_relevant_tab_in_context();
  await Logout();
}

async function validate_can_edit_own_profile() {
  await Add_traveler___I_am_the_traveler();
  await waitForText(page, ".traveler-name", 'Edit Profile');
  await page.click(".traveler-name");
  await waitForText(page, "#el-id-653-34", 'Edit');
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("#el-id-5027-35", middle2);
  await page.waitFor(1000);
  await page.click(".btn--primary");
  await Success_toast_alert();
  await page.waitFor(2000);
  await waitForText(page, "#el-id-5027-35", middle2);
  await close_tab___choose_relevant_tab_in_context();
}

async function validate_can_see_but_can_t_edit_profile_of_others_1() {
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await add_traveler_by_name('View');
  await waitForText(page, ".traveler-name", 'View Profile');
  await page.click(".traveler-name");
  await waitForText(page, "#el-id-9513-34", 'View');
  await page.waitFor(2000);
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("#el-id-5027-35", middle2b);
  await page.waitFor(1000);
  await page.click(".btn--primary");
  await Success_toast_alert();
  await page.waitFor(2000);
  await waitForText(page, "#el-id-5027-35", middle2b);
  await close_tab___choose_relevant_tab_in_context();
}

async function Copy_of_add_traveler_by_name(name) {
  await page.click(".traveler-name");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", name);
  await page.waitFor(300);
  await page.click("h2");
}

async function validate_can_see_and_edit_profile_of_others() {
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await Copy_of_add_traveler_by_name('no gender');
  await waitForText(page, ".user-profile-title p", 'Your profile settings');
  await waitForText(page, ".help", 'This field is required');
  await page.click("body > div:nth-child(17) > div > div > header > button > i > svg");
}

async function case_1___privilege_can_view_profile_of_other_users_1() {
  await Login('edit@profile.com');
  await book_a_new_trip();
  await validate_can_edit_own_profile();
  await validate_can_see_but_can_t_edit_profile_of_others_1();
  await validate_can_see_and_edit_profile_of_others();
  await close_tab___choose_relevant_tab_in_context();
  await Logout();
}

async function validate_can_edit_own_profile_1() {
  await Add_traveler___I_am_the_traveler();
  await waitForText(page, ".traveler-name", 'Prevent Prevent');
  await page.click(".traveler-name");
  await waitForText(page, "h1", 'Prevent Prevent');
  await page.waitFor(2000);
  await scrollTo(page, 0, 32);
  // Converting a 'negative-element-validation' step has to be done manually at this time
  await close_tab___choose_relevant_tab_in_context();
}

async function validate_can_see_but_can_t_edit_profile_of_others_2() {
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await add_traveler_by_name('view');
  await waitForText(page, ".traveler-name", 'View Profile');
  await page.click(".traveler-name");
  await page.waitFor(2000);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  if (false) {
    // Converting a 'negative-element-validation' step has to be done manually at this time
  }
}

async function add_traveler_without_gender() {
  await page.click(".traveler-name");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveller');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'no gender');
  await page.waitFor(300);
  await page.click("h2");
}

async function validate_can_t_see_or_edit_profile_of_others() {
  if (true) {
    return;
  }
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".traveler-name", 'Add traveller');
  await add_traveler_without_gender();
  await waitForText(page, "body > :nth-child(18) [role='heading']", 'Mandatory Details Are Missing');
  await waitForText(page, ".is-flex-direction-row .is-flex", 'Please note,This traveler\'s profile has missing details and cannot be added to the reservation.Please ask the traveler to log in and update their profile details before proceeding.');
  await page.click("body > :nth-child(18) [xmlns='http://www.w3.org/2000/svg']");
}

async function add_traveler_without_gender_1() {
  await page.click(".traveler-name");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveller');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'empty field');
  await page.waitFor(300);
  await page.click("h2");
}

async function validate_warning_pop_up_when_adding_traveler_without_gender() {
  if (true) {
    return;
  }
  await page.waitFor(1000);
  await waitForText(page, ".traveler-name", 'Add traveller');
  await add_traveler_without_gender_1();
  await waitForText(page, "body > :nth-child(18) [role='heading']", 'Mandatory Details Are Missing');
  await waitForText(page, ".is-flex-direction-row .is-flex", 'Please note,This traveler\'s profile has missing details and cannot be added to the reservation.Please ask the traveler to log in and update their profile details before proceeding.');
  await page.click("body > :nth-child(18) [xmlns='http://www.w3.org/2000/svg']");
}

async function case_1___privilege_can_view_profile_of_other_users_2() {
  await Login('Prevent@profileupdate.com');
  await book_a_new_trip();
  await validate_can_edit_own_profile_1();
  await validate_can_see_but_can_t_edit_profile_of_others_2();
  await validate_can_t_see_or_edit_profile_of_others();
  await validate_warning_pop_up_when_adding_traveler_without_gender();
  await close_tab___choose_relevant_tab_in_context();
  await Logout();
}

async function validate_can_t_edit_own_profile() {
  await Add_traveler___I_am_the_traveler();
  await waitForText(page, ".traveler-name", 'OWN PROFILE');
  await page.click(".traveler-name");
  await waitForText(page, "#el-id-83-34", 'OWN');
  await page.waitFor(2000);
  // Converting a 'random-value-generator' step has to be done manually at this time
  await page.type("#el-id-5027-35", middle4);
  await page.waitFor(2000);
  await page.click(".btn--primary");
  await Success_toast_alert();
  await page.waitFor(2000);
  await waitForText(page, "#el-id-5027-35", middle4);
  await close_tab___choose_relevant_tab_in_context();
}

async function validate_can_t_see_or_edit_profile_of_others_1() {
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await add_traveler_by_name('view');
  await waitForText(page, ".traveler-name", 'View Profile');
  await page.click(".traveler-name");
  await page.waitFor(2000);
  // Converting a 'html-attr-validation' step has to be done manually at this time
  if (false) {
    // Converting a 'negative-element-validation' step has to be done manually at this time
  }
}

async function add_traveler_without_gender_2() {
  await page.click(".traveler-name");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'no gender');
  await page.waitFor(300);
  await page.click("h2");
}

async function validate_warning_pop_up_when_adding_traveler_without_gender_1() {
  await page.click("[class^='mx'], [class*=' mx'] .is-clickable");
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await add_traveler_without_gender_2();
  await waitForText(page, "body > :nth-child(18) [role='heading']", 'Mandatory Details Are Missing');
  await waitForText(page, ".is-flex-direction-row .is-flex", 'Please note,This traveler\'s profile has missing details and cannot be added to the reservation.Please ask the traveler to log in and update their profile details before proceeding.');
  await page.click("body > :nth-child(18) [xmlns='http://www.w3.org/2000/svg']");
}

async function add_traveler_without_mandatory_field() {
  await page.click(".traveler-name");
  await page.click("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']");
  await waitForText(page, ".autocomplete-title", 'Search specific traveler');
  await page.type("[popperclass='app-autocomplete-popper user-autocomplete-popper styled-scrollbar']", 'empty field');
  await page.waitFor(300);
  await page.click("h2");
}

async function validate_warning_pop_up_when_adding_traveler_without_mandatory_field() {
  await page.waitFor(1000);
  await waitForText(page, ".add-btn .is-flex", /Add traveler/);
  await add_traveler_without_mandatory_field();
  await waitForText(page, "body > :nth-child(18) [role='heading']", 'Mandatory Details Are Missing');
  await waitForText(page, ".is-flex-direction-row .is-flex", 'Please note,This traveler\'s profile has missing details and cannot be added to the reservation.Please ask the traveler to log in and update their profile details before proceeding.');
  await page.click("body > :nth-child(18) [xmlns='http://www.w3.org/2000/svg']");
}

async function case_3___privilege_prevent_updating_other_and_own_profile() {
  await Login('OWN@PROFILE.com');
  await book_a_new_trip();
  await validate_can_t_edit_own_profile();
  await validate_can_t_see_or_edit_profile_of_others_1();
  await validate_warning_pop_up_when_adding_traveler_without_gender_1();
  await validate_warning_pop_up_when_adding_traveler_without_mandatory_field();
  await close_tab___choose_relevant_tab_in_context();
  await Logout();
}

async function validate_empty() {
  await page.waitFor(10000);
  // Converting a 'negative-element-validation' step has to be done manually at this time
}

async function case_5___validate_can_t_enter_profile_from_link() {
  await Login('OWN@PROFILE.com');
  await book_a_new_trip();
  await Add_traveler___I_am_the_traveler();
  await page.goto('https://ui.gtp-staging.com/user/53270182?tripId=3380622');
  await validate_empty();
}

