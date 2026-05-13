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
    Given I am logged in as "galileogaliei@gdggalileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    When I extract the price from room level results
    And I click the first price breakdown button
    And I extract prices from the price breakdown
    Then the room level price should match the price breakdown total
    And the night price should match the price breakdown total
    And the subtotal should match the price breakdown total