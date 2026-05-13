# Test Name: 35108 Flight - When searching for Business class the addional pricing options must display the Business brands BSFLXPLUS
# Status: Active
# Labels: CR7,No Amadeus Hotel Book,Regression,Keeps failing,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-08-28T06:53:03Z
# Updated: 2025-11-14T02:38:02Z

@regression @flights @general @sabre
Feature: 35108 Flights - Business class pricing options display Business brands
  As a corporate traveler
  I want to see Business brands like BSFLXPLUS in pricing options
  So that I can choose the appropriate business class fare

  Scenario: Business class pricing options display Business brands BSFLXPLUS
    Given I am logged in as "sabre@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip "Business" class flight from "LHR" to "KUL"
    And flight results should be available
    And I filter results by carrier "EK"
    And I click to open first pricing options
    Then the "Business Flexplus" brand should be displayed in pricing options