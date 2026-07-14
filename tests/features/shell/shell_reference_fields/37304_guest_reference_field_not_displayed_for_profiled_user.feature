# Test Name: 37304 Guest reference field is not displayed when adding a profiled user
# Description:
# Status: Active
# Labels: Regression,Reference Fields,GDS,Profile,guest,Sabre,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-10-07T02:25:16Z
# Updated: 2026-02-16T02:40:32Z

@shell @reference_fields @regression @guest
Feature: 37304 - Guest reference field is not displayed for a profiled user

  As a booker booking for a profiled user
  I want the guest-only reference fields to be hidden
  So that only the fields relevant to a profiled traveller are shown

  Scenario: Guest reference field is not displayed at new-trip and checkout for a profiled traveller
    Given I am logged in as "tree@tree.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "NYC"
    Then the following checkout reference fields should not be visible:
    | *Only For Guest |
    And I click proceed button if visible
    When I add the first flight to cart
    And the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    And I fill in the OOP justification text "abc"
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should not be visible:
    | *Only For Guest |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
