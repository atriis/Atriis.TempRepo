# Test Name: 40204 [Merge] Amadeus/Hotels - Hotel results are showing agreements property first and room level has the "Filter non agreement GDS hotels" applied correctly
# Description: 
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,Agreement,Hotel,Results page hotel,Amadeus,merge,Filters,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-18T01:50:05Z
# Updated: 2025-05-27T12:48:56Z

@regression @provider:amadeus
Feature: 40204 Amadeus - Filter non agreement GDS hotels
  As a corporate traveler using Amadeus, that has "Filter non agreement GDS hotels" in the administration
  I want to see only hotels and rooms with agreements

  @priority:high
  Scenario: Agreement hotels are displayed and agreement filter works in room level
    Given I am logged in as "brunasantos@filternonagreement.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I wait to see view rates text in results page
    Then agreement badge should be visible on all hotels in hotel level results
    Then the "TMC" filter tag should be visible in hotel results
    Then the "My Corporate" filter tag should be visible in hotel results
    Then the sort filter has "Most recommended" selected
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    Then agreement badge should be visible on all rooms in room level results
    Then the "TMC" filter tag should be visible in room level results
    Then the "My Corporate" filter tag should be visible in room level results
