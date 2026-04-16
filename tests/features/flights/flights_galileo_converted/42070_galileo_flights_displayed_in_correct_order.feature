# Test Name: 42070 Galileo - Flights are displayed in correct order
# Status: Active
# Labels: Regression,Galileo,Flights,progress page,Cancel by process,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-18T05:13:21Z
# Updated: 2026-01-19T07:41:30Z

@regression @galileo @flights @full_purchase
Feature: 42070 Galileo - Flights are displayed in correct order

  As a corporate traveler
  I want flights to be displayed in the correct order
  So that I can verify booking details are consistent

  Scenario: Flight details are displayed in correct order before and after booking
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added a random guest traveler
    When I search for a random round trip flight
    And I wait for flight results to be available
    # TODO: Extracting_values — extract flight details (carrier, times, etc.) from results page for later comparison
    And I add the first flight to cart
    # TODO: Validating_values_before_booking — verify extracted values match cart values before booking
    And I proceed to checkout
    And I complete the booking
    # TODO: Validating_values_after_booking — verify extracted values match trip overview values after booking
