# Test Name: 66081 Galileo - Verify correct pricing for Ryanair flights via Galileo with multiple passengers
# Status: Active
# Labels: Regression,Galileo,results,price,2026 plan 2
# Owner: Sónia Sousa
# Created: 2025-08-27T02:06:46Z
# Updated: 2025-10-07T07:48:21Z

@regression @provider:galileo @flights @pricing @multi_pax @priority:high
Feature: 66081 Galileo - Correct pricing for Ryanair with multiple passengers

  As a corporate traveler
  I want pricing to be correctly displayed for Ryanair flights with multiple passengers
  So that currency conversion and per-passenger pricing are accurate

  Scenario: Ryanair pricing is correct for 3 passengers in results and pricing options
    Given I am logged in as "galileoonly.gray@testimtest.com" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "AGP" to "BOH"
    And flight results should be available
    And I filter airline results by "Ryanair" checkbox
    And I extract the price for the first flight result and store it
    And I extract the price for the first flight original currency result and store it
    And I verify that the extracted price in flight results is correctly converted from "EUR" to "USD"
    And I click to open first pricing options
    And I extract the price for the first flight pricing option result and store it
    And I extract the price for the first flight pricing option original currency and store it
    And I verify that the extracted price in flight pricing options is correctly converted from "EUR" to "USD"