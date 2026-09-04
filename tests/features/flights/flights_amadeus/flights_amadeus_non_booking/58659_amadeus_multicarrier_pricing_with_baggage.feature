# Test Name: 58659 Amadeus - Flights - Multicarrier - Pricing options load when one flight has brand fares and the other one doesn't
# Description:
# Status: Active
# Labels: Amadeus,Flights,Regression,Pricing Options,additional pricing options,multicarrier,Branded fares,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-25T01:38:24Z
# Updated: 2025-05-12T08:33:24Z

@regression @flights @amadeus @pricing-options @multicarrier @branded-fares
Feature: 58659 Amadeus - Flights - Multicarrier - Pricing options load when one flight has brand fares and the other one doesn't
  As a corporate traveler
  I want pricing options to load for multicarrier flights with baggage
  So that I can compare options even when carriers differ in branded fares

  Scenario: Pricing options load when one flight has brand fares and the other one doesn't
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AUH" to "KCH"
    And flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    And I click to open first pricing options
    Then pricing options are displayed
