@transportation @cars @regression @provider:galileo
Feature: 62086 - Galileo Cars - User Cancels Trip with Two Cars

  Scenario: Verify user can successfully cancel a booked trip with two cars
    Given I am logged in with a Galileo account
    When I book two cars in a single trip
    Then the trip should contain two car bookings
    When I cancel the trip
    Then all car bookings should be cancelled
    And the trip cancellation should be successful
