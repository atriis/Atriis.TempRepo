# Test Name: 63529 HCorpo content is not available
# Description: 
# Status: Active
# Labels: hcorpo,No Amadeus Hotel Book,Regression,Cart,results,66444 hotel results,2026 plan 2
# Owner: Yael
# Created: 2025-06-16T01:15:50Z
# Updated: 2025-10-28T05:24:46Z

@regression @provider:general
Feature: 63529 General - hCorpo hotel logo visible and can be added to trip
  As a corporate traveler
  I want to see the hCorpo logo on qualifying hotels and be able to add them to a trip
  So that hCorpo branded hotels are identifiable and bookable

  @priority:medium
  Scenario: hCorpo hotel logo is visible in room level and hotel can be added to cart
    Given I am logged in as "general" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Ibis Styles Makkah" for 1 night
    And I select the first hotel result
    # TODO: Create step "Then the hCorpo logo should be visible in room level results" that calls DSL verifyHCorpoLogo in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"

