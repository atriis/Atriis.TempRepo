# Test Name: 33776 Copy Trip - Agent Assistance, Only selected products are copied
# Description: flight, hotel and car in the cart (added by the agent). one of them was added to the trip by the corporate. the copy trip will copy only the added one
# Status: Active
# Labels: Regression,Request Assistance,Cars,Flights,No Amadeus Hotel Book,Hotel,Copy Trip,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-07-13T08:42:50Z
# Updated: 2026-02-16T01:56:23Z

@regression @shell @copy-trip @request-assistance @flights @hotel @cars
Feature: 33776 - Copy trip only copies products added to the trip (agent assistance)
  As a corporate traveler who requested agent assistance
  I want copy trip to copy only the products that were actually added to the trip
  So that agent-suggested items still sitting in the cart are not copied

  Scenario: Only the product added to the trip is copied, suggested items are not
    Given I am logged in as "asi@stance.com" booking a new trip
    And I have added myself as the traveler
    When I click the request assistance icon
    # TODO: Create step 'I fill in the request assistance flight from {string} to {string}' — fill the flight leg of the request form without sending (Testim: From/To autocomplete 'lhr'/'MAD' + depart/return dates). Reuse candidate: 'I send a flight travel request from {string} to {string}' (that step also sends the request)
    And I fill in the request assistance flight from "lhr" to "MAD"
    # TODO: Create step 'I add a car to the request assistance picking up in {string}' — expand the car section of the request form and fill pick-up location + dates (Testim: .btns-list :nth-child(3) 'JFK', pick-up/drop-off dates). Reuse candidate: 'I add a car to the request assistance picking up in {string} with comment {string}'
    And I add a car to the request assistance picking up in "JFK"
    # TODO: Create step 'I add a hotel to the request assistance in {string}' — expand the hotel section of the request form and fill destination + check-in/out (Testim: .btns-list :nth-child(2) 'lon', check in/out dates)
    And I add a hotel to the request assistance in "lon"
    When I click the send request button
    Then the "Sent to agent" confirmation should be displayed
    # TODO: Create step 'the request assistance success description should be {string}' — assert the success message description (Testim: .success-message__description 'Your request was successfully created')
    And the request assistance success description should be "Your request was successfully created"
    When I navigate to the trip from the travel request
    # --- agent adds flight, car and hotel to the trip in legacy GTP ---
    # TODO: Create step 'I log in to legacy GTP as the agent {string}' — open the legacy GTP site and sign in as the agent (Testim: goto https://2.gtp-staging.com, #username 'amy@deus.com', #Password, .loginButtonSubmit; handles sign-out-if-needed)
    And I log in to legacy GTP as the agent "amy@deus.com"
    # TODO: Create step 'I open the current trip in legacy GTP as the agent' — navigate the agent to the requested trip by its number (Testim: goto https://2.gtp-staging.com/Trip/<tripNumber>)
    And I open the current trip in legacy GTP as the agent
    # TODO: Create step 'I add a flight to the trip as the agent from {string}' — re-search the flight online and add the first result to the cart in legacy GTP (Testim: onFlightReSearchClicked, #from0 'DOH', add #button-flight0)
    And I add a flight to the trip as the agent from "DOH"
    # TODO: Create step 'I add a car to the trip as the agent' — re-search the car online and add the first result in legacy GTP (Testim: onCarReSearchClicked, #carItem0 trip-cart-icon)
    And I add a car to the trip as the agent
    # TODO: Create step 'I add a hotel to the trip as the agent' — re-search the hotel online and add the first room in legacy GTP (Testim: onHotelReSearchClicked, #hotelItem0, room trip-cart-icon)
    And I add a hotel to the trip as the agent
    # --- back as the corporate: add only the car quote to the trip, then copy ---
    When I refresh the page
    # TODO: Create step 'I open the trip overview tab' — click the trip overview tab in the cart (Testim: #tab-overview p). Reuse candidate: 'the trip overview tab should be displayed'
    And I open the trip overview tab
    # TODO: Create step 'I add the suggested car quote to the trip' — click the add button on the agent-suggested car quote card (Testim: .car-quote-card .btn)
    And I add the suggested car quote to the trip
    Then I should see a success notification
    # --- copy the trip ---
    # TODO: Create step 'I open the copy trip dialog' — hover the trip actions menu and click Copy trip (Testim: .dropdowns-container .expand-icon → #el-id-1344-210 li:nth-child(2)). Reuse candidate: part of 'I copy the trip'
    When I open the copy trip dialog
    # TODO: Create step 'the copy trip dialog should list a car quote' — assert the copy dialog shows the car item (Testim: .bold-text matches /Hire a car at/)
    Then the copy trip dialog should list a car quote
    # TODO: Create step 'the copy trip dialog quote status should be {string}' — assert the copy dialog quote status (Testim: [aria-label='Copy trip'] .app-label 'Pending Booking')
    And the copy trip dialog quote status should be "Pending Booking"
    # TODO: Create step 'only the car quote should be listed in the copy trip dialog' — assert only the added car quote appears, not the agent-suggested flight/hotel (Testim: validation-code-step, manual in source)
    And only the car quote should be listed in the copy trip dialog
    # TODO: Create step 'I confirm the copy trip' — click the primary Copy trip button in the dialog (Testim: [aria-label='Copy trip'] .btn--primary). Reuse candidate: part of 'I copy the trip'
    When I confirm the copy trip
    Then the booking status should be "Pending booking"
    # TODO: Create step 'the copied trip should contain a car quote' — assert the copied trip overview shows the car (Testim: .el-tabs .has-text-weight-semibold matches /Hire a car at/)
    And the copied trip should contain a car quote
    # TODO: Create step 'the copied trip suggested items section should be displayed' — assert the Suggested items section is shown in the copied trip (Testim: 'Suggested items' title + JFK 'car at' title)
    And the copied trip suggested items section should be displayed
    # TODO: Create step 'the copied trip suggested items should contain the expected number of quotes' — assert the count of suggested-item quotes in the copied trip (Testim: validate_number_of_quotes_in_suggented_items, manual in source)
    And the copied trip suggested items should contain the expected number of quotes
