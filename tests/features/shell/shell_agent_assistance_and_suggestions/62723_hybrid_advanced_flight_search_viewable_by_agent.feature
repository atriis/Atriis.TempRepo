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
    And I open the advanced flight search in the request assistance form
    And I send an advanced flight search travel request from "London" to "Tel Aviv" with a stop in "Rome" and preferred airline "British Airways"
      | direction | dateType  | time     | cabin    |
      | outbound  | Departure | Midnight | Business |
      | return    | Arrival   | Morning  | Business |
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
    And go to trip text is visible
    When I click go to trip button
    Then the travel requested item should be visible in the trip with the title containing "Requested flight to Ben Gurion APT, IL (TLV)" text
