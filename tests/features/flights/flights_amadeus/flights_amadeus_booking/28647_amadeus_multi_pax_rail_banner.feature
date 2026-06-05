# Test Name: 28647 MERGED Amadeus flight Booking for 2 ADTs + banner for rail after searching a flight
# Description: HYBRID for 30912 If paid by corporate, no need to show the client card name
# Status: Active
# Labels: Regression,Flights,Amadeus,No Amadeus Hotel Book,Adding Passengers,Full Purchase,Search Flight,Cancel by process,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-08T01:33:26Z
# Updated: 2026-01-19T01:31:38Z

@regression @flights @amadeus @multi-pax @full-purchase
Feature: 28647 Amadeus - Multi-pax booking with rail banner
  As a corporate traveler
  I want to book a flight for 2 passengers and see rail banner
  So that I can consider greener transport options and book for multiple travelers

  Scenario: Book round trip for 2 ADTs and verify rail banner is displayed
    Given I am logged in as "amos@one.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "alvares azevedo"
    When I search for a round trip flight from "AMS" to "BRU"
    And I click proceed button if visible
    And flight results should be available
    Then the rail banner should be visible in results
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    Then the passenger initials "AO" should be visible
    And the passenger initials "AA" should be visible
