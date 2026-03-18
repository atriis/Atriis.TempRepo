# Test Name: 40204 [Merge] Amadeus/Hotels - Hotel results are showing agreements property first and room level has the "Filter non agreement GDS hotels" applied correctly
# Description: 
# Status: Active
# Labels: Regression,No Amadeus Hotel Book,Agreement,Hotel,Results page hotel,Amadeus,merge,Filters,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-18T01:50:05Z
# Updated: 2025-05-27T12:48:56Z

@regression @provider:amadeus
Feature: 40204 Amadeus - Agreement hotels displayed and filterable
  As a corporate traveler
  I want to see agreement (preferred) hotels first and filter by agreement in room level
  So that I can easily identify and book company-preferred properties

  @priority:high
  Scenario: Agreement hotels are displayed and agreement filter works in room level
    Given I am logged in as "brunafilternonagreement" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I wait to see view rates text in results page
    Then handshake badge should be visible in hotel level results
    Then the "TMC" filter tag should be visible in hotel results
    Then the "My Corporate" filter tag should be visible in hotel results
    Then the sort filter has "Most recommended" selected
    And I select the first hotel result
    And I wait for the first add to trip button in room level results to be visible
    Then handshake badge should be visible in room level results
    Then the "TMC" filter tag should be visible in room level results
    Then the "My Corporate" filter tag should be visible in room level results
