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
    Given I am logged in as "bsgalileoflight@galileoflight.com" booking a new trip
    And I have added a random guest traveler
    When I search for a random round trip flight
    And flight results should be available
    And I store the first flight result details for later comparison
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And the stored flight details should match the displayed flight details
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    And the stored flight details should match the displayed flight details
