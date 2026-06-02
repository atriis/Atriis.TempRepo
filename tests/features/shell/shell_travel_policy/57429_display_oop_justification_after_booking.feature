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
    And I wait for booking details in checkout
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    Then the out of policy indicator should be visible in cart
    Then the OOP justification text should be "abc"
    Then the OOP policy reason should be "Destination is not brazil"
    Then I successfully cancel the trip
