# Test Name: 41059 Flights - Amadeus +AFKL - Pricing options are displayed according to the lowest fare
# Status: Active
# Labels: Flights,Pricing Options,Amadeus,price,AFKL NDC Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-05T04:24:56Z
# Updated: 2024-11-12T08:54:13Z

@regression @flights @general @ndc @afkl @pricing-options
Feature: 41059 Flights - Amadeus AFKL pricing options displayed according to lowest fare
  As a corporate traveler
  I want to see pricing options ordered from lowest to highest
  So that I can easily compare fares

  Scenario: Pricing options are displayed in increasing price order for KLM
    Given I am logged in as "joana" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "BHX"
    And I filter results by carrier "KLM"
    And I click on "Pricing Options" for the first result
    Then pricing options should be displayed in increasing price order
