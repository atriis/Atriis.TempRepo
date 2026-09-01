# Test Name: 80804 Unused Tickets banner and filter shown when a result is eligible
# Status: Active
# Labels: Regression,Flights,unused tickets,2026 plan 2

# ADO Test Case ID: 80804
@regression @flights @unused-tickets @ado:80804
Feature: 80804 Flights - Unused Tickets banner and filter shown when a result is eligible
  As a corporate traveler with unused tickets
  I want the Unused Tickets banner and filter to appear when a search result can use my unused tickets
  So that I know my unused tickets can be applied to this trip

  # The traveler must actually hold unused tickets or every assertion below passes vacuously.
  # unusedTkt@corp.frosch holds AA/United/Delta tickets; it has no reference fields, so no trip purpose.
  @priority:high
  Scenario: Banner and filter are shown when a result is eligible for unused tickets (LAX-ORD)
    Given I am logged in as "unusedTkt@corp.frosch" booking a new trip
    And I have added myself as the traveler
    And I start intercepting the "flightSearch" API response
    When I search for a round trip flight from "LAX" to "ORD"
    And flight results should be available
    Then the intercepted response should have at least one result where "hasUnusedTicket" is "true"
    And the unused tickets banner should be visible in results
    And the unused tickets filter should be visible in results
