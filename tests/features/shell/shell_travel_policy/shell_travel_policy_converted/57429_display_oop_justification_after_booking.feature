# Test Name: 57429 Display OOP justification in the trip after booking
# Description:
# Status: Active
# Labels: Regression,Flights,Travel policy,OOP,justification,Cart,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-02-26T12:41:31Z
# Updated: 2025-02-26T12:57:43Z

@regression @travel_policy @oop @flights @justification @daily_shell @shell
Feature: 57429 Travel Policy - OOP justification displayed in trip after booking

  As a corporate traveler
  I want to see my OOP justification in the trip details after booking
  So that the justification reason is preserved and visible post-booking

  Scenario: OOP justification text is displayed in trip after hold booking
    Given I am logged in as "sam@travelpolicy.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "NYC"
    And I add the first flight to cart
    And I fill in the OOP justification text "abc"
    And I proceed to checkout
    # TODO: Click cart button to go back to trip view
    Then the trip status should be "On hold"
    # TODO: Verify "Out of policy" title is visible in trip
    # TODO: Verify justification text "abc" is displayed
    # TODO: Verify policy reason "Destination is not brazil" is displayed
    Then I successfully cancel the trip
