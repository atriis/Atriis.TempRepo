# Test Name: 80804 Unused Tickets banner and filter shown, and filter narrows results
# Status: Active
# Labels: Regression,Flights,unused tickets,2026 plan 2

# ADO Test Case ID: 80804
@regression @flights @unused-tickets @ado:80804
Feature: 80804 Flights - Unused Tickets banner and filter shown, and filter narrows results
  As a corporate traveler with unused tickets
  I want the Unused Tickets banner and filter to appear when a search result can use my unused tickets
  So that I know my unused tickets can be applied to this trip

  # The traveler must actually hold unused tickets or every assertion below passes vacuously, which is
  # what the search-page list check guards: it names the traveler the tickets belong to and fails on an
  # empty list. Alexandra Calvin holds tickets valid for ATL-EWR; the account has no reference fields,
  # so no trip purpose.
  @priority:high
  Scenario: Banner and filter are shown, and the filter narrows the results, when a result is eligible
    Given I am logged in as "unusedTkt@corp.frosch" booking a new trip
    And I have added traveler by name "Alexandra Calvin"
    Then the unused tickets icon should be visible next to the traveler
    When I click the airplane icon next to the traveler to view unused tickets
    Then the unused tickets list should be displayed for traveler "Alexandra Calvin"
    When I close the unused tickets modal
    And I start intercepting the "flightSearch" API response
    And I search for a round trip flight from "ATL" to "EWR"
    Then flight results should be available
    And the intercepted response should have at least one result where "hasUnusedTicket" is "true"
    And the unused tickets banner should be visible in results
    And the unused tickets filter should be visible in results
    When I filter results by unused tickets available
    Then the flight results should narrow to the unused tickets filter count
    And all flight results should show the unused tickets eligibility tag
