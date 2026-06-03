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
    Then the booking status should be "Pending booking"
    Then the out of policy indicator should be visible in cart
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    And I fill in the OOP justification text "Yes"
