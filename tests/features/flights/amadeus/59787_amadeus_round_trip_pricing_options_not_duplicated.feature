# Test Name: 59787 Amadeus - Round Trip Flight - Pricing Options are not duplicated
# Status: Active
# Labels: Regression,Amadeus,Flights,additional pricing options,Pricing Options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-25T09:09:08Z

@regression @amadeus @flights @pricing_options
Feature: 59787 Amadeus - Round trip pricing options are not duplicated
  As a corporate traveler
  I want to view pricing options for a round trip flight
  So that I can confirm each segment shows distinct pricing options

  Scenario: Pricing options are not duplicated for round trip flight
    Given I am logged in as "taylor" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "MNL"
    And I click proceed on the reference fields popup
    And flight results should be available
    And I click to open first pricing options
    When I extract the price from pricing option at index 0
    And I extract the price from pricing option at index 1
    Then the extracted price at index 0 should not equal the extracted price at index 1
    And I select the first option from pricing options
    When I extract the price from pricing option at index 0
    And I extract the price from pricing option at index 1
    Then the extracted price at index 0 should not equal the extracted price at index 1