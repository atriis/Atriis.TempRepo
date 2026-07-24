# Test Name: 29785 MERGED Copy Trip - Products eligible for copy - flight hotel and car + Prevent updating personal information
# Description: if the user has the role: Prevent updating others and own profile, then data entered in the trip does not updated in the administration
# Status: Active
# Labels: Role,Administration,Frequent flyer,Hotel loyalty number,Car loyalty number,passport,GDS,Hotel,Cars,Flights,No Amadeus Hotel Book,Regression,Copy Trip,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-29T06:16:39Z
# Updated: 2025-05-27T10:26:28Z

@regression @shell @copy-trip @flights @hotel @cars @administration
Feature: 29785 - Copy trip with eligible products and prevent updating personal information
  As a corporate traveler with the "prevent updating others and own profile" role
  I want to copy a trip containing a flight, hotel and car with loyalty and passport details
  So that the copied trip keeps the products while the personal details are not saved to the administration

  Scenario: Copy a flight, hotel and car trip and confirm personal details are not persisted to administration
    Given I am logged in as "Amy@Gadasy.com" booking a new trip
    And I have added myself as the traveler
    # --- add a flight, hotel and car to the cart ---
    # Testim toggled an advanced-search checkbox (.advanced-search-container .el-checkbox__inner) before searching — verify whether parallel hotel/car should be disabled when implementing
    When I search for a round trip flight from "LHR" to "NYC"
    And I click proceed button if visible
    And I add the first flight to cart
    And I click proceed button if visible
    When I click to add a hotel to my trip from cart
    # TODO: Create step 'I submit the pre-filled hotel search from the cart drawer' — click search on the hotel search that is pre-populated from the flight (Testim: .hotel-search-cmp shows '1 Room' → .btn--size-large; no destination typed). Reuse candidate: 'I search for a hotel in {string} for {int} night(s) from the cart drawer'
    And I submit the pre-filled hotel search from the cart drawer
    And I add a refundable room to my cart
    And I click proceed button if visible
    Then the booking status should be "Pending booking"
    And the hotel should appear as refundable in cart
    # TODO: Create step 'I click to add a car to my trip from cart' — click the car product in the cart trip bar and submit the pre-populated car search (Testim: .flicking-camera :nth-child(3) .icon-text → .btn--size-large). Reuse candidate: 'I click to add a hotel to my trip from cart' / 'I click to add a flight to my trip from cart'
    When I click to add a car to my trip from cart
    And I add the first car to cart
    And I click proceed button if visible
    # --- add loyalty numbers, passport and frequent flyer via the cart quote extras ---
    # TODO: Create step 'I add a hotel loyalty number {string} in the quote extras' — expand the hotel quote loyalty-number extras, pick the first chain and type the number (Testim: .quote-extras--loyalty-number .is-clickable → [type='number'] '123456')
    When I add a hotel loyalty number "123456" in the quote extras
    # TODO: Create step 'I add a passport {string} with nationality {string} and expiry {string} in the flight passenger info' — expand flight passenger info extras and fill passport number, nationality and expiry date (Testim: .flight-passenger-info .is-clickable → pane-1611740 text '456789', #el-id-3360-3372 'netherlands', date '03/05/2030')
    And I add a passport "456789" with nationality "netherlands" and expiry "03/05/2030" in the flight passenger info
    # TODO: Create step 'I add a flight frequent flyer number {string} for airline {string} in the extras' — expand flight frequent flyer extras and fill number + airline (Testim: .flight-frequent-flyer .is-clickable → [placeholder='Frequent Flyer'] '789654', #el-id-3360-6176 'el al')
    And I add a flight frequent flyer number "789654" for airline "el al" in the extras
    # TODO: Create step 'I add a car driver loyalty number {string} in the extras' — expand car driver loyalty extras and fill the number (Testim: .car-driver-loyalty .is-clickable → [type='text'] '854712')
    And I add a car driver loyalty number "854712" in the extras
    Then I should see a success notification
    # --- copy the trip ---
    # TODO: Create step 'I open the copy trip dialog' — hover the trip actions menu and click Copy trip (Testim: .dropdowns-container .expand-icon → #el-id-3360-2105 li:nth-child(2)). Reuse candidate: part of 'I copy the trip'
    When I open the copy trip dialog
    # TODO: Create step 'the copy trip dialog should show the message {string}' — assert the copy trip modal intro text (Testim: .regular-text p 'The following items will be copied to a new trip')
    Then the copy trip dialog should show the message "The following items will be copied to a new trip"
    # TODO: Create step 'all products in the copy trip dialog should show status {string}' — assert each of the 3 quotes in the copy dialog shows the status (Testim: .quote-details-container :nth-child(1..3) .app-label 'Pending Booking')
    And all products in the copy trip dialog should show status "Pending Booking"
    # TODO: Create step 'I confirm the copy trip' — click the primary Copy trip button in the dialog (Testim: [aria-label='Copy trip'] .btn--primary). Reuse candidate: part of 'I copy the trip'
    When I confirm the copy trip
    # --- validate the copied trip contents ---
    # TODO: the copied trip opens in a new browser tab — switch to it before validating (reuse candidate: 'I work on tab {int}')
    And I work on tab 2
    # TODO: Create step 'the copied trip should contain the same flight, hotel and car' — assert the copied trip quotes match the original hotel name, flight number and car type (Testim: pane-overview hotel h4, carrier-container flight number, .center-title car type; source vars hotelName/flightNumber/carType were never captured — capture them on the original trip first)
    Then the copied trip should contain the same flight, hotel and car
    # --- validate personal details were NOT saved to the administration ---
    When I navigate to the administration page
    And I open the Users tab in the administration
    And I search for user "Amy Gadasy" in the administration
    And I open the first user in the administration users list
    # TODO: Create step 'the passport section should be empty in the administration' — open the Passports and Visas tab and assert no passport was saved (Testim: CorporateUserTabs.passport tab, 'Add Passport' header, negative-element-validation)
    Then the passport section should be empty in the administration
    # TODO: Create step 'the frequent flyer membership number should not be saved in the administration' — open the Frequent flyer tab and assert the membership number entered in the trip is absent (Testim: CorporateUserTabs.frequent tab, 'Frequent flyer / Membership number' header, negative-element-validation; dismiss 'Proceed without saving' dialog if shown)
    And the frequent flyer membership number should not be saved in the administration
    # TODO: Create step 'the car loyalty number should not be saved in the administration' — assert the car loyalty number entered in the trip is absent from the profile (Testim: negative-element-validation after scroll)
    And the car loyalty number should not be saved in the administration
