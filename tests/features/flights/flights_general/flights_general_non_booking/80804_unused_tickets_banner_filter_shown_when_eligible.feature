# Test Name: 80804 Unused Tickets banner and filter shown when a result is eligible
# Status: Active
# Labels: Regression,Flights,unused tickets,2026 plan 2

# ADO Test Case ID: 80804
@regression @flights @unused-tickets @ado:80804
Feature: 80804 Flights - Unused Tickets banner and filter shown when a result is eligible
  As a corporate traveler with unused tickets
  I want the Unused Tickets banner and filter to appear when a search result can use my unused tickets
  So that I know my unused tickets can be applied to this trip

  @priority:high
  Scenario: Banner and filter are shown when a result is eligible for unused tickets (JFK-TLV)
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    And I start intercepting the "flightSearch" API response
    When I search for a round trip flight from "JFK" to "TLV"
    And I select the trip purpose as "Conference" and proceed
    And flight results should be available
    Then the intercepted response should have at least one result where "hasUnusedTicket" is "true"
    And the unused tickets banner should be visible in results
    And the unused tickets filter should be visible in results
