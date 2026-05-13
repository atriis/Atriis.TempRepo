# Test Name: 42852 corporate user doesn't see markup for hotel
# Description: 
# Status: Active
# Labels: Regression,Hotel,sun hotels,No Amadeus Hotel Book,mark up,price,results,Results page hotel,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-05-30T10:47:00Z
# Updated: 2024-10-28T12:53:18Z

@regression @provider:general
Feature: 42852 General - Price breakdown shows no markup for corporate
  As a corporate traveler
  I want to see the price breakdown in room level and verify no markup is applied
  So that I can confirm corporate rates are being offered without additional fees

  @priority:high
  Scenario: Price breakdown shows no markup for corporate account
    Given I am logged in as "mark@sunhot.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "MAD" for 1 night
    And I select the first hotel result
    When I click the first price breakdown button
    And I extract prices from the price breakdown
    Then the subtotal should match the price breakdown total
