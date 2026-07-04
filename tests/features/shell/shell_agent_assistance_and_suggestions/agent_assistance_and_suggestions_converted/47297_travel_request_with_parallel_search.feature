# Test Name: 47297 can send travel request when using parallel search
# Description:
# Status: Active
# Labels: Regression,Request Assistance,Parallel,Flights,Hotel,No Amadeus Hotel Book,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-06-19T09:20:53Z
# Updated: 2026-02-15T08:31:04Z

@regression @shell @request_assistance @flights @hotel @parallel
Feature: 47297 - Can send a travel request when using parallel search

  As a traveler using request assistance
  I want to run a parallel flight and hotel search and send it for assistance
  So that my parallel search selections are captured in the travel request sent to the agent

  Scenario: Send a travel request from a parallel flight and hotel search
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD" without clicking search button
    # TODO: I check the Add hotel to this trip parallel option (FlightSearch.clickFlightTabAndCheckParallelHotel in tests/steps/flight_search.steps.js)
    And I check the Add hotel to this trip parallel option
    # TODO: the travel request flight depart date field should be populated (TravelRequest.verifyFlightDepartDatePopulated in tests/steps/travel_request.steps.js)
    Then the travel request flight depart date field should be populated
    # TODO: the travel request flight return date field should be populated (TravelRequest.verifyFlightReturnDatePopulated in tests/steps/travel_request.steps.js)
    And the travel request flight return date field should be populated
    When I click the request assistance icon
    # TODO: the travel request travelers section title should display {string} (TravelRequest.verifyTravelersSectionTitle in tests/steps/travel_request.steps.js)
    Then the travel request travelers section title should display "Who are the travellers?"
    # TODO: the travel request form should show product {string} (TravelRequest.verifyProductInRequestForm in tests/steps/travel_request.steps.js)
    And the travel request form should show product "Flight"
    # TODO: the travel request flight origin should show {string} (TravelRequest.verifyRequestFlightOrigin in tests/steps/travel_request.steps.js)
    And the travel request flight origin should show "London, United Kingdom - All airports (LON)"
    # TODO: the travel request flight destination should show {string} (TravelRequest.verifyRequestFlightDestination in tests/steps/travel_request.steps.js)
    And the travel request flight destination should show "Madrid, Spain (MAD)"
    # TODO: the travel request flight depart date should show the selected departure date (TravelRequest.verifyRequestFlightDepartDate in tests/steps/travel_request.steps.js)
    And the travel request flight depart date should show the selected departure date
    # TODO: the travel request flight return date should show the selected return date (TravelRequest.verifyRequestFlightReturnDate in tests/steps/travel_request.steps.js)
    And the travel request flight return date should show the selected return date
    # TODO: I scroll down the travel request form (CommonPage.scrollTo in tests/steps/common.steps.js)
    When I scroll down the travel request form
    # TODO: the travel request form should show product {string} (TravelRequest.verifyProductInRequestForm in tests/steps/travel_request.steps.js)
    Then the travel request form should show product "Hotel"
    # TODO: the travel request hotel destination should show {string} (TravelRequest.verifyRequestHotelDestination in tests/steps/travel_request.steps.js)
    And the travel request hotel destination should show "Madrid,Spain,(MAD)"
    # TODO: the travel request hotel check-in date should show the selected date (TravelRequest.verifyRequestHotelCheckInDate in tests/steps/travel_request.steps.js)
    And the travel request hotel check-in date should show the selected date
    # TODO: the travel request hotel check-out date should show the selected date (TravelRequest.verifyRequestHotelCheckOutDate in tests/steps/travel_request.steps.js)
    And the travel request hotel check-out date should show the selected date
    # TODO: I click the send request button (TravelRequestPage.clickSendRequestButton in tests/steps/travel_request.steps.js)
    When I click the send request button
    # TODO: the {string} reference form popup should be displayed (DynamicAndReferenceFields.verifyReferenceFormTitle in tests/steps/dynamic_fields.steps.js)
    Then the "Trip Reference Form" reference form popup should be displayed
    When I select the first available financial reference
    And I select the first available option for the {string} reference field
    # TODO: I save the trip reference form (DynamicAndReferenceFields.waitAndClickSaveButtonModal in tests/steps/dynamic_fields.steps.js)
    And I save the trip reference form
    Then I should see a success notification
    And the "Sent to agent" confirmation should be displayed
