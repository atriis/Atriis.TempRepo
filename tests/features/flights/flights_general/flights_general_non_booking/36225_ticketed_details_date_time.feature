# Test Name: 36225 New UI Flight - Ticketed details (date and time) are shown
# Status: Active
# Labels: Regression,Flights,Cart,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-21T06:08:58Z
# Updated: 2024-09-15T10:02:00Z

@regression @flights @general @cart
Feature: 36225 Flights - Ticketed details date and time are shown
  As a corporate traveler
  I want to see ticketed details including date and time in the price breakdown
  So that I know when the booking was made

  Scenario: Ticketed details with date and time are shown in price breakdown
    Given I am logged in as "carolina@adma.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "JFK"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click to open price breakdown in cart
    Then the booked by text with date and time should be visible in price breakdown
