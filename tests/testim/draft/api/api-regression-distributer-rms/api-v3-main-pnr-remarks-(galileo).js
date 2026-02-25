/*
 * Test Name: API V3 Main- PNR Remarks (Galileo)
 * Description: Validate flight remarks after hold and at issue. tmc=GDG
 * Status: Draft
 * Labels: 
 * Owner: pini harush
 * Created: 2024-03-31T01:52:48Z
 * Updated: 2026-02-16T10:19:23Z
 */
 
"use strict";

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({headless: false});
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://ui.gtp-staging.com");
  await API_Validation__Create_New_Trip_For_I_m_The_Traveler__GDG_();
  await API_Validation__Search_Flight('NYC', 'LAX', '2026-05-18T00:00:00', 'Y');
  await API_Validation__Select_Flight();
  await API__Hold_Flight();
  await page.waitFor(300000);
  await Api_Validation__Remarks_Validation__Main();
  await API__Issue__checkout__Flight();
  await page.waitFor(300000);
  await Api_Validation__Remarks_Validation__Main_1();
  await API_Validation__Cancel_Trip();
  await browser.close();
})();

// shared steps \\
async function API_Validation__AuthForAPi(username, password, SubscriptionKey) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Create_New_Trip() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Save_Traveler__I_am_the_Traveler_() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Get_User_Info() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__NewTrip__I_am_The_traveler__all_suppliers() {
  await API_Validation__AuthForAPi("Galileo@uh7.api", "MAGA!$$2k26", '58294d71f764436fa8282de44cb90cfd');
  await API_Validation__Create_New_Trip();
  await API_Validation__Save_Traveler__I_am_the_Traveler_();
  await API_Validation__Get_User_Info();
}

async function API_Validation__Get_Reference_Fields(RefAnswer) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Save_Search_Reference_Fields() {
  const boolean_42 = await page.evaluate(() => {
    var filtered=referenceFields.filter(r=>r.isDynamic==false&&editable);
    if(filtered&&filtered.length>0){
        return true;
    }
    return false;
  }).catch(() => false);
  if (!boolean_42) {
    return;
  }
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Create_New_Trip_For_I_m_The_Traveler__GDG_() {
  await API_Validation__NewTrip__I_am_The_traveler__all_suppliers();
  await API_Validation__Get_Reference_Fields('asdf');
  await API_Validation__Save_Search_Reference_Fields();
}

async function API_Validation__Search_Flight(origin, destination, departDate, cabin) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Select_Flight() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Get_Quotes() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validations__Parse_Flight_Quotes() {
  await page.evaluate(() => {
    var flightQuotes=quotes.flightQuotes;
    var list=[];
    for(var i=0;i<flightQuotes.length;i++){
        if(flightQuotes[i].status==0){
            var bookingItem={
                productType:flightQuotes[i].product,
                quoteId:flightQuotes[i].quoteId,
                sourceSystem:flightQuotes[i].sourceSystem,
                officeId:flightQuotes[i].officeId,
                addFOP:false,
                addApis:false,
                originalPrice:flightQuotes[i].displayTotalPrice
            }
            list.push(bookingItem);
        }
    }
    exportsTest.BookingItems=JSON.stringify(list);
  });
}

async function API_Validation__Hold_Flights() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API__Hold_Flight() {
  await API_Validation__Get_Quotes();
  await API_Validations__Parse_Flight_Quotes();
  await API_Validation__Hold_Flights();
}

async function Api_Validation__Remarks_Validation__Main() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Get_Reference_Fields_Checkout(RefAnswer) {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Save_Checkout_Reference_Fields() {
  const boolean_43 = await page.evaluate(() => {
    var filtered=referenceFields.filter(r=>r.editable);
    if(filtered&&filtered.length>0){
        return true;
    }
    return false;
  }).catch(() => false);
  if (!boolean_43) {
    return;
  }
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__TripInit_information() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Book_Quotes() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API__Issue__checkout__Flight() {
  await API_Validation__Get_Reference_Fields_Checkout('asdess');
  await API_Validation__Save_Checkout_Reference_Fields();
  await API_Validation__TripInit_information();
  await API_Validation__Book_Quotes();
}

async function Api_Validation__Remarks_Validation__Main_1() {
  // Converting a 'api-action' step has to be done manually at this time
}

async function API_Validation__Cancel_Trip() {
  // Converting a 'api-action' step has to be done manually at this time
}

