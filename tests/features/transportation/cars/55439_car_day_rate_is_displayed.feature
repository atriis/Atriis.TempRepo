# Test Name: 55439 Car - Display day rate
# Description:
# Status: Active
# Labels: Cars,Gray Dawes,price,Regression,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-12-09T05:24:09Z
# Updated: 2025-09-29T02:40:40Z
@regression @cars
Feature: 55439 Car day rate is displayed consistently
  As a corporate traveler
  I want to see day-rate pricing consistently across the car flow
  So that pricing details remain reliable from results through cart details

  @priority:high
  Scenario: Validate day rate across results, cart, new search, and more details
    Given I am logged in as "automation@galileo.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" for 7 days with drop-off time "15:00"
    Then the first car result shows "8 days total" and a daily rate
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    And the daily rate is displayed under the price in the cart
    And I click more details in cart
    Then the more details drawer shows a daily rate and subtotal consistent with 8 days
    And the daily rate in more details should match the results and cart daily rate
    And I close more details in cart
    When I click to add a car to my trip from cart
    And I search for a car for 7 days with drop-off time "08:00" from the cart drawer
    Then the first car result shows "7 days total" and a daily rate
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    And the daily rate is displayed under the price for the last car in cart
    And I click more details for the last car in cart
    Then the more details drawer shows a daily rate and subtotal consistent with 7 days
    And the daily rate in more details should match the results and cart daily rate
