# Test Name: 47723 Galileo - Filter by car class suv/pickup/van, complete booking for pickup
# Description:
# Status: Active
# Labels: Galileo,Regression,Gray Dawes,Cars,Adding Passengers,Transportation,2026 plan 1
# Owner: Noam Miller
# Created: 2024-06-27T07:36:27Z
# Updated: 2025-10-16T05:21:02Z
@regression @cars @provider:galileo
Feature: 47723 Galileo filters by car class and books a pickup vehicle
  As a corporate traveler
  I want to filter Galileo car classes before booking
  So that the selected vehicle type can be validated end to end

  @priority:critical
  Scenario: Filter by SUV, van, and pickup before completing a booking
    Given I am logged in as "automation@galileo.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a car at "Los Angeles Intl. (LAX), Los Angeles, CA, United States"
    And I wait for add to trip text to be visible
    And I filter results by "SUV"
    Then all the car options on this page contain "SUV" model text
    When I remove the filter "SUV"
    And I filter results by "Van"
    Then all the car options on this page contain "Van" model text
    When I remove the filter "Van"
    And I filter results by "Pickup"
    Then all the car options on this page contain "Pickup" model text
    When I add the first car to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip
