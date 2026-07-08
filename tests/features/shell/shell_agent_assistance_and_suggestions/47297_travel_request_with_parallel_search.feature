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
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD" without clicking search button
    And I extract departure and return dates
    And I click on the flight tab and check Add hotel to this trip
    And I click the request assistance icon
    Then the travel request travelers section title should display "Who are the travellers?"
    And the travel request form should show product "Flight"
    And the travel request flight origin should show "London, United Kingdom - All airports (LON)"
    And the travel request flight destination should show "Madrid, Spain (MAD)"
    And the travel request flight depart date should show the extracted departure date
    And the travel request flight return date should show the extracted return date
    When I scroll down the travel request form
    Then the travel request form should show product "Hotel"
    And the travel request hotel destination should show "Madrid,Spain,(MAD)"
    And the travel request hotel check-in date should show the extracted flight departure date
    And the travel request hotel check-out date should show the extracted flight return date
    When I click the send request button
    And I save the reference field popup if displayed
    Then the "Sent to agent" confirmation should be displayed
    And I click go to trip button
    Then the travel requested item should be visible in the trip with the title containing "Requested" text
