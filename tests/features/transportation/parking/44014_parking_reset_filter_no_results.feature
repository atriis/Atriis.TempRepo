# Test Name: 44014 Parking - Display "reset filter" when there are no results
# Description:
# Status: Active
# Labels: UK Parking,Regression,Daily Transportation,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-02-26T09:30:54Z
# Updated: 2025-12-15T03:57:00Z

@regression @transportation @parking @daily
Feature: 44014 Parking - Reset filter button appears when filters yield no results

  As a corporate traveler
  I want to see a reset filters button when my applied filters return no parking results
  So that I can clear filters and search again with different criteria

  Scenario: Reset filter button is visible after applying filters that return no results
    Given I am logged in as "rafaelrocha@ukparking.com" booking a new trip
    And I have added myself as the traveler
    When I search for UK parking at "LHR"
    And I wait for add to trip text to be visible
    And I filter results by "Terminal 4" checkbox
    And I filter results by "Park and Ride" checkbox
    Then the reset filters button should be visible
