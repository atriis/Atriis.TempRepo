# Test Name: 58659 Amadeus - Flights - Multicarrier - Pricing options load when one flight has brand fares and the other one doesn't (both have baggages)
# Description:
# Status: Active
# Labels: Amadeus,Flights,Regression,Pricing Options,additional pricing options,multicarrier,Branded fares,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-25T01:38:24Z
# Updated: 2025-05-12T08:33:24Z

@regression @flights @amadeus @pricing-options @multicarrier @branded-fares
Feature: 58659 Amadeus - Multicarrier pricing options with baggage
  As a corporate traveler
  I want pricing options to load for multicarrier flights with baggage
  So that I can compare options even when carriers differ in branded fares

  Scenario: Pricing options load for multicarrier flight with checked baggage fees filter
    Given I am logged in as "taylor@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AUH" to "KCH"
    And I click proceed on the reference fields popup
    And flight results should be available
    # TODO: Filter results by "Checked baggage fees" advisory filter
    # Testim: scrolls to advisories filter section, checks "Checked baggage fees" checkbox,
    # verifies first result shows baggage icon and carrier name "Multiple Carriers"
    # Need new step: When I filter results by "Checked baggage fees" advisory
    # DSL: FlightResults.filterByAdvisory(page, "Checked baggage fees")
    # Page: FlightResultsPage — scroll to .advisories-filter, click checkbox with value
    And I click to open first pricing options
    # Testim verifies: waitForText(page, ".options-header p", /option/) — pricing options loaded
