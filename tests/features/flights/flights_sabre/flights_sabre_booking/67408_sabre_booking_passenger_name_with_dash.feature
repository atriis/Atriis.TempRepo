# Test Name: 67408 Sabre - Flights - Booking succeeds when passenger's name contains a dash
# Status: Active
# Labels: Sabre,Regression,Full Purchase,Flights,name,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-18T03:22:11Z
# Updated: 2026-01-19T07:49:12Z

@regression @flights @sabre @full-purchase @cancel-by-process
Feature: 67408 Sabre - Booking succeeds when passenger name contains a dash
  As a corporate traveler
  I want to book a flight for a passenger whose name contains a dash
  So that the booking is successful regardless of special characters in the name

  Scenario: Sabre flight booking succeeds for passenger with dash in name
    Given I am logged in as "robsoncruz@sabrecargdg.com" booking a new trip
    And I have added traveler by name "Ana Antonoli-Carto"
    When I search for a one way flight from "LAX" to "IAH"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
