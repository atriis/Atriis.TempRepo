# Test Name: 63172 Travel Request - When searching flight and checking 'Add hotel in', flight and hotel options are visible in travel request
# Description:
# Status: Active
# Labels: Regression,Flights,Request Assistance,Hotel,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-06-06T08:12:19Z
# Updated: 2025-09-14T12:47:32Z

@regression @shell @request_assistance @flights @hotel
Feature: 63172 - When searching a flight and checking 'Add hotel to this trip', flight and hotel options are visible in the travel request

  As a traveler using request assistance
  I want to search a flight with the add-hotel option and send it for assistance
  So that both flight and hotel options appear in my travel request

  Scenario: Flight and hotel options visible in the travel request
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "NYC" without clicking search button
    # TODO: I check the Add hotel to this trip option (FlightSearchPage.checkParallelHotelSearch in tests/steps/flight_search.steps.js)
    And I check the Add hotel to this trip option
    And I click the request assistance icon
    # TODO: the {string} product should be visible in the travel request (TravelRequest.verifyProductVisibleInRequest in tests/steps/travel_request.steps.js)
    Then the "Flight" product should be visible in the travel request
    And the "Hotel" product should be visible in the travel request
    # TODO: the hotel search options should be visible in the travel request (TravelRequest.verifyHotelSearchOptionsVisible in tests/steps/travel_request.steps.js)
    And the hotel search options should be visible in the travel request
