# Test Name: 33825 Pricing Options - 'Economy pricing' text is displayed
# Status: Active
# Labels: Flights,AFKL NDC Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-28T01:39:22Z
# Updated: 2025-04-28T07:31:56Z

@regression @flights @ndc @afkl
Feature: 33825 AFKL - Pricing Options economy pricing text is displayed
  As a corporate traveler
  I want to see the economy pricing label in pricing options
  So that I know the fare class I am viewing

  Scenario: Economy pricing text is displayed in pricing options
    Given I am logged in as "bsafkl@bsafkl.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "PAR" to "BKK"
    And I click to open first pricing options
    Then the "Economy pricing" text should be displayed in pricing options