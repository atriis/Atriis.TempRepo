# Test Name: 37335 Guest reference field is displayed when adding guest traveller
# Description:
# Status: Active
# Labels: Regression,Reference Fields,GDS,Profile,guest,Sabre,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-10-07T10:39:09Z
# Updated: 2025-09-07T01:06:40Z

@shell @reference_fields @regression @guest
Feature: 37335 - Guest reference field is displayed when adding a guest traveller

  As a booker adding a guest traveller
  I want the guest-only reference fields to be displayed
  So that I can provide the required guest reference information

  Scenario: Guest reference field is displayed at new-trip and checkout for a guest booking
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "MIA"
    # TODO: implement step - verify the guest reference field is displayed on the new trip
    Then the reference field "IS THIS A GUEST BOOKING? DROPDOWN" is displayed
    # TODO: implement step - answer the guest reference field and trip purpose, then proceed
    When I answer the guest reference fields and proceed
    When I add the first flight to cart
    When I proceed to checkout
    # TODO: implement step - verify the guest reference field is displayed at checkout
    Then the reference field "Only for Guest" is displayed
    # TODO: implement step - answer the guest reference field dropdown at checkout
    When I answer the guest reference field at checkout
    When I open the cart
    # TODO: implement step - verify the quote status is "On hold"
    Then the quote status is "On hold"
    Then I successfully cancel the trip
