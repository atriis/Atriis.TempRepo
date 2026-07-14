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

  # Need to talk to Pini about this one, administration is incorrect 
  Scenario: Guest reference field is displayed at new-trip and checkout for a guest booking
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "MIA"
    Then the following checkout reference fields should be visible:
    | *Only For Guest |
    And I click proceed button if visible
    When I add the first flight to cart
    And the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    And I fill in the OOP justification text "abc"
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should be visible:
    | *Only For Guest |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
