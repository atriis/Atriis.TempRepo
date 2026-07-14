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
    # TODO: implement step - verify the profiled reference fields are displayed on the new trip
    Then the reference field "REASON FOR DIVISION CHANGE" is displayed
    # TODO: implement step - verify the trip purpose reference field is displayed
    And the reference field "TRIP PURPOSE" is displayed
    # TODO: implement step - verify exactly 2 reference field labels are displayed (no guest-only field)
    And exactly 2 reference field labels are displayed
    # TODO: implement step - answer the reference fields and proceed
    When I answer the guest reference fields and proceed
    When I add the first flight to cart
    When I proceed to checkout
    # TODO: implement step - verify the "Travellers Reference Questions" section is displayed at checkout
    Then the "Travellers Reference Questions" reference section is displayed
    # TODO: implement step - was a Testim negative-element-validation; verify the guest-only reference field is not displayed at checkout
    And the guest-only reference field is not displayed
    When I open the cart
    # TODO: implement step - verify the quote status is "On hold"
    Then the quote status is "On hold"
    Then I successfully cancel the trip
