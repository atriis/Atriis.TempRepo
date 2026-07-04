# Test Name: 62723 Travel Request/Request Assistance - Advanced flight search details can be viewed by Agent
# Description:
# Status: Active
# Labels: hybrid,Regression,Flights,Advanced search,Request Assistance,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-23T04:34:52Z
# Updated: 2025-09-17T12:39:18Z

@regression @shell @request_assistance @flights
Feature: 62723 - Advanced flight search details can be viewed by Agent
  As a traveler needing help booking a complex flight
  I want to send an advanced flight search request to an agent for assistance
  So that the agent can view my detailed flight search criteria and book on my behalf

  Scenario: Agent can view advanced flight search details from a request assistance submission
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I click the request assistance icon
    # TODO: I open the advanced flight search in the request assistance form (TravelRequest.openAdvancedFlightSearch in tests/steps/travel_request.steps.js)
    And I open the advanced flight search in the request assistance form
    # TODO: I send an advanced flight search travel request with preferred airline "British Airways" (TravelRequest.sendAdvancedFlightSearchTravelRequest in tests/steps/travel_request.steps.js) - enters origins/destinations/dates/times/cabin classes for London / Rome / Tel Aviv
    And I send an advanced flight search travel request with preferred airline "British Airways"
    # TODO: I save the reference field popup if displayed (TravelRequest.saveReferenceFieldIfPresent in tests/steps/travel_request.steps.js)
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
    And go to trip text is visible
    When I click go to trip button
    Then the travel requested items should be visible in the trip
    # TODO (manual): assert the requested advanced flight is shown in the trip — source getText(".trip-title") had no expected value; reuse the existing step "the trip title should contain {string}" (Cart.verifyTripTitle) once a value is chosen
