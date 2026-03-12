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
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    When I filter results by "Agreement" checkbox
    # TODO: Create step "Then the first hotel result should have the agreement badge" that calls DSL verifyAgreementBadge in HotelSearch.js
    And I select the first hotel result
    # TODO: Create step "Then the agreement badge should be visible in room level results" that calls DSL verifyAgreementInRoomLevel in RoomLevelResults.js
