# Test Name: 80805 Unused Tickets banner and filter hidden when no result is eligible
# Status: Active
# Labels: Regression,Flights,unused tickets,2026 plan 2

# ADO Test Case ID: 80805
@regression @flights @unused-tickets @ado:80805
Feature: 80805 Flights - Unused Tickets banner and filter hidden when no result is eligible
  As a corporate traveler with unused tickets
  I want the Unused Tickets banner and filter to be hidden when no search result can use my unused tickets
  So that I am not shown the banner and filter when none of the results are eligible

  @priority:high
  Scenario: Banner and filter are hidden when no result is eligible for unused tickets (LON-LIS)
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    And I start intercepting the "flightSearch" API response
    When I search for a round trip flight from "LON" to "LIS"
    And I select the trip purpose as "Conference" and proceed
    And flight results should be available
    Then the intercepted response should have no result where "hasUnusedTicket" is "true"
    And the stops filter should be visible in flight results
    And the unused tickets banner should not be visible in results
    And the unused tickets filter should not be visible in results
