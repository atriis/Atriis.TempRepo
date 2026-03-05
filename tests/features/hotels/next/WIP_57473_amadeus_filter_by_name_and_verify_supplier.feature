# Test Name: 57473 Amadeus - Hotel - Supplier corresponds to the one that is configured in admin
# Description: 
# Status: Active
# Labels: Amadeus,Hotel,supplier,GDS,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-31T11:49:03Z
# Updated: 2025-11-20T08:14:52Z

@regression @provider:amadeus
Feature: 57473 Amadeus - Filter hotel by name and validate correct supplier
  As a corporate traveler
  I want to filter hotel results by hotel name and verify the correct supplier is shown
  So that I can find and book from a specific hotel chain and confirm the supplier

  @priority:medium
  Scenario: Filter by hotel name and verify supplier in room level results
    Given I am logged in as "amadeus" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Hilton Cambridge" for 1 night
    When I filter results by "Hilton" checkbox
    And I wait to see view rates text in results page
    Then the "Amadeus" supplier logo should be visible in hotel results
    And I select the first hotel result
    Then the "Amadeus" supplier logo should be visible in room level results

