# Test Name: 69243 GDS Flights - Multi City - All segments are displayed in Pricing Options
# Status: Active
# Labels: Regression,multi city,GDS,general,Flights,additional pricing options,Pricing Options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-23T03:59:44Z
# Updated: 2026-02-16T10:39:00Z

@regression @flights @general @gds @multi-city @pricing-options
Feature: 69243 GDS Flights - Multi city all segments displayed in pricing options
  As a corporate traveler
  I want to see all multi-city segments in the pricing options
  So that I can review fares for each segment

  Scenario: All multi-city segments are visible in pricing options
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city flight with legs "MAD-LHR" and "DUB-ORY" and "BRU-MAD"
    And flight results should be available
    And I click to open first pricing options
    Then all pricing option segments "MAD-LHR" and "DUB-ORY" and "BRU-MAD" should be visible and selectable
    And I add to trip from pricing options
    And the booking status should be "Pending booking"
