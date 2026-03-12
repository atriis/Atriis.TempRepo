# Test Name: 65013 Galileo - Hotel - Price breakdown matches the room level result price
# Description: 
# Status: Active
# Labels: Galileo,Hotel,Regression,price,price breakdown,room level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-08-01T10:01:48Z
# Updated: 2025-09-16T01:24:28Z

@regression @provider:galileo
Feature: 65013 Galileo - Price breakdown total matches displayed room price
  As a corporate traveler using Galileo
  I want to open the price breakdown and verify the totals match the displayed room price
  So that I can trust the pricing information shown in results

  @priority:high
  Scenario: Total in price breakdown matches displayed room price in Galileo results
    Given I am logged in as "beatriz" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I extract the total price from room level results" that calls DSL extractRoomLevelTotalPrice in RoomLevelResults.js
    # TODO: Create step "When I open the price breakdown for the first room" that calls DSL openPriceBreakdown in RoomLevelResults.js
    # TODO: Create step "Then the price breakdown total should match the displayed room price" that calls DSL comparePriceBreakdownWithRoomPrice in RoomLevelResults.js
