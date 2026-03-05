# Test Name: 46171 Ratehawk - "Paid at the hotel" icon and tooltip are displayed
# Description: 
# Status: Active
# Labels: Hotel,Ratehawk Regression,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-16T01:49:23Z
# Updated: 2025-10-23T07:06:53Z

@regression @provider:ratehawk
Feature: 46171 Ratehawk - "Paid at hotel" icon and tooltip visible
  As a corporate traveler using Ratehawk
  I want to see the "Paid at hotel" payment icon and its tooltip in hotel results
  So that I know payment is made directly at the hotel

  @priority:medium
  Scenario: "Paid at hotel" icon is visible with correct tooltip in room level
    Given I am logged in as "ratehawk" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Porto, Portugal" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button in room level results to be visible
    When I click on price details button in room level results
    And I hover over info icon next to taxes and fees
    Then the "Paid at hotel" tooltip should be correct
