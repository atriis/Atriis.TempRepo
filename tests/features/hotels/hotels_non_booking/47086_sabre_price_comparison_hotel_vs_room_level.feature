# Test Name: 47086 Sabre - Hotel - The first value from the hotel level and the first value of the room level are the same (the lowest)
# Description: 
# Status: Active
# Labels: Regression,Sabre,Hotel,price,GDS,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-06-06T11:22:40Z
# Updated: 2025-03-31T10:04:36Z

@regression @provider:sabre
Feature: 47086 Sabre - Price comparison between hotel level and room level
  As a corporate traveler using Sabre
  I want to compare hotel-level displayed price with room-level displayed price
  So that I can verify price consistency across hotel result pages

  @priority:high
  Scenario: Hotel level price matches room level price for Sabre results
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Paris France" for 1 night
    And I wait to see view rates text in results page
    When I extract the price from hotel level results
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    When I extract the price from room level results
    Then the hotel level price should match the room level price