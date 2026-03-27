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

  # TODO: New user needed — sabre@testim.com → USER_SABRE_TESTIM
  # Add to .env: USER_SABRE_TESTIM="sabre@testim.com"

  Scenario: Business class pricing options display Business brands BSFLXPLUS
    Given I am logged in as "sabre_testim" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Search round trip flight with Business class" — FlightSearch.searchRoundTripBusiness(page, from, to)
    When I search for a round trip flight from "LHR" to "KUL"
    And flight results should be available
    And I filter results by carrier "EK"
    And I click on "Pricing Options" for the first result
    # TODO: Step needed for "Verify Business Flexplus brand is displayed in pricing options"
