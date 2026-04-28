# Test Name: 53913 "Hold" should act like the "Checkout" button
# Status: Active
# Labels: Regression,Flights,2026 plan 1
# Owner: pini harush
# Created: 2024-11-04T01:32:04Z
# Updated: 2024-11-04T02:19:13Z

@regression @flights @general @hold
Feature: 53913 Flights - Hold should act like the Checkout button
  As a corporate traveler
  I want the Hold button to require payment like the Checkout button
  So that payment is set before holding a flight

  Scenario: Hold button requires payment method like checkout
    Given I am logged in as "airplus" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MEX" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I click hold flight button
    Then the hold flight button should be disabled
    And I add a credit card as payment method
    And I hold the trip
    Then I successfully cancel the trip
  
