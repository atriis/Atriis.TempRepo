# Test Name: 69245 NDC Flights - Multi City - All segments are displayed in Pricing Options
# Status: Active
# Labels: Regression,NDC,general,Flights,multi city,Pricing Options,additional pricing options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-23T04:58:33Z
# Updated: 2025-11-26T06:01:33Z

@regression @flights @ndc @multi-city @pricing-options
Feature: 69245 NDC Flights - Multi city all segments displayed in pricing options
  As a corporate traveler booking NDC multi-city flights
  I want to see all segments in the pricing options
  So that I can review fares for each NDC segment

  Scenario: All NDC multi-city segments are visible in pricing options
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "FRA-ZRH" and "ZRH-SIN" and "SIN-ZRH"
    And flight results should be available
    And I click to open first pricing options
    Then all pricing option segments "FRA-ZRH" and "ZRH-SIN" and "SIN-ZRH" should be visible and selectable
    And I add to trip from pricing options
    And the booking status should be "Pending booking"
