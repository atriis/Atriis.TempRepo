# Test Name: 57324 Reference Fields - Dropdown is fiterable by typing
# Description:
# Status: Active
# Labels: Reference Fields,Regression,Checkout,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-27T08:06:15Z
# Updated: 2025-09-11T08:04:11Z

@shell @reference_fields @regression @checkout
Feature: 57324 - Reference field dropdown is filterable by typing

  As a booker
  I want to filter a reference field dropdown by typing
  So that I can quickly find and select the option I need

  Scenario: Filter a reference field dropdown by typing and select the matching option
    Given I am logged in as "alicemara@reffieldsspecifictest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PAR" to "GRU"
    When I add the first flight to cart
    When I proceed to checkout
    And I wait for booking details in checkout
    When I filter the reference field dropdown by typing "dulux"
    Then the reference field dropdown option "DULUX 6102030120" is displayed
    When I select the reference field dropdown option "DULUX 6102030120"
    Then the reference fields should have the following values:
      | field       | value           |
      | COST CENTRE TEST 1 | DULUX 6102030120 |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
