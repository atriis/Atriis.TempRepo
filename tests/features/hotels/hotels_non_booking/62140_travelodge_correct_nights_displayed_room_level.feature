# Test Name: 62140 Travelodge - Correct number of nights is displayed in room level page
# Description: 
# Status: Active
# Labels: Travelodge,Hotel,Regression,room level,Giata,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-16T03:09:23Z
# Updated: 2025-09-14T11:02:09Z

@regression @provider:travelodge
Feature: 62140 Travelodge - Correct number of nights displayed in room level
  As a corporate traveler booking a Travelodge for 3 nights
  I want to see the correct number of nights displayed in room level results
  So that I can confirm the duration before adding to cart

  @priority:medium
  Scenario: Room level results show the correct number of nights for a 3-night search
    Given I am logged in as "pluto@travelodgecorp.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London Borough of Camden" for 3 nights
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And the room level results should display 3 nights

