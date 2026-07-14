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
    # TODO: implement step - verify the "Travellers Reference Questions" section is displayed
    Then the "Travellers Reference Questions" reference section is displayed
    # TODO: implement step - filter the reference field dropdown by typing
    When I filter the reference field dropdown by typing "dulux"
    # TODO: implement step - verify the filtered option is displayed
    Then the reference field dropdown option "DULUX 6102030120" is displayed
    # TODO: implement step - select the filtered reference field option
    When I select the reference field dropdown option "DULUX 6102030120"
    # TODO: implement step - verify the reference field shows the selected value
    Then the reference field shows the value "DULUX 6102030120"
    When I open the cart
    Then I successfully cancel the trip
