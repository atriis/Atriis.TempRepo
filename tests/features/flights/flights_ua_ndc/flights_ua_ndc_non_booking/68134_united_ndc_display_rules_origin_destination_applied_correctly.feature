# Test Name: 68134 United NDC - Display rules 'Origin' and 'Destination' are applied correctly
# Description:
# Status: Active
# Labels: United,UA,UA ndc,Regression,NDC,display rules,Flights,2026 plan 2,03
# Owner: Bruna Santos
# Created: 2025-09-26T04:10:05Z
# Updated: 2025-09-26T05:18:21Z

@regression @flights @ndc @united @display-rules
Feature: 68134 United NDC - Display rules Origin and Destination are applied correctly

  As a corporate traveler
  I want to verify that display rules correctly suppress results for restricted routes
  So that I only see flights available for my configured origin and destination rules

  Scenario: No results found when display rules restrict the route
    Given I am logged in as "united" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "ORD" to "PIT"
    Then the no results found message should be displayed
