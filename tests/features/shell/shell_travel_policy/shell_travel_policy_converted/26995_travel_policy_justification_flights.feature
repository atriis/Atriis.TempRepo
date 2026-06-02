# Test Name: 26995 Travel Policy Justification Flights
# Description: OOP notification appears when Policy is violated and can't procced to checkout without fill in OOP field
# Status: Active
# Labels: OOP,Travel policy,Regression,No Amadeus Hotel Book,2026 plan 1
# Owner: Unassigned
# Created: 2023-03-22T07:26:41Z
# Updated: 2024-10-28T07:10:30Z

@regression @travel_policy @oop @shell
Feature: 26995 Travel Policy - Justification required for OOP flights

  As a corporate traveler
  I want to be notified when my flight selection violates travel policy
  So that I can provide justification before proceeding to checkout

  Scenario: OOP notification appears and justification is required to proceed
    Given I am logged in as "poli@justific.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "JFK" to "PHX"
    And I add the first flight to cart
    Then the out of policy indicator should be visible in cart
    When I proceed to checkout
    # TODO: Verify error message "*In order to proceed, please add all required information" is displayed
    When I fill in the OOP justification text "Yes"
    Then I successfully cancel the quote
