# Test Name: 65440 Amadeus - Flights - Booking successful with preferred seats
# Status: Active
# Labels: Regression,Flights,Full Purchase,Seating,Amadeus,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-28T03:38:43Z

@regression @amadeus @flights @seating @preferred_seats
Feature: 65440 Amadeus - Booking successful with preferred seats
  As a corporate traveler
  I want to select preferred seats when booking a flight
  So that the booking completes successfully with my preferred seating

  Scenario: Booking a round trip flight with preferred seats selected
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "SEA" to "SBA"
    And I wait for add to trip text to be visible
    And I filter airline results by "Alaska" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 5
    And I click add seats in extras
    And I wait for the seat map to load
    And I select a random preferred seat
    And I click next flight button
    And I wait for the seat map to load
    And I select a random preferred seat
    And I save and close seat map drawer
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
  
