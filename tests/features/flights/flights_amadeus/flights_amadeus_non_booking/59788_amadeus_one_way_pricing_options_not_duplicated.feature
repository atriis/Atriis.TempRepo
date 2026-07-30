# Test Name: 59788 Amadeus - One Way Flight - Pricing Options are not duplicated
# Status: Active
# Labels: Regression,Amadeus,Flights,additional pricing options,Pricing Options,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-25T10:14:54Z

@regression @amadeus @flights @pricing_options
Feature: 59788 Amadeus - One way pricing options are not duplicated
  As a corporate traveler
  I want to view pricing options for a one way flight
  So that I can confirm that reopening pricing options shows consistent data

  Scenario: Pricing options are not duplicated for one way flight
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MNL"
    And I click to open first pricing options
    When I extract the price from pricing option at index 0
    And I extract the price from pricing option at index 1
    Then the extracted price at index 0 should not equal the extracted price at index 1