# Test Name: 58343 Premier Inn - Booking fee corresponds to the one configured in administration
# Description: 
# Status: Active
# Labels: Premier Inn Regression,Hotel,booking fee,room level,hotel level,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-14T07:42:36Z
# Updated: 2025-02-14T08:22:14Z

@regression 
Feature: 58343 Premier Inn - Booking fee corresponds to the one configured in administration
  As a corporate traveler booking a Premier Inn
  I want the price in room level to include the booking fee from the administration
  So that I have accurate pricing information throughout the booking flow

  @priority:medium
  Scenario: price shown in room level includes the booking fee from administration
    Given I am logged in as "magalimonica@premierinnbookingfee.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I wait to see view rates text in results page
    When I extract the price from hotel level results
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    When I extract the price from room level results
    Then the booking fee from hotel level should match the booking fee from room level