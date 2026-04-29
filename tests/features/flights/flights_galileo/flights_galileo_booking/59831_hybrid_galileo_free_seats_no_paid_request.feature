# Test Name: HYBRID for 59831 Galileo - Add free seats, not sending request for paid seats
# Status: Active
# Labels: Regression,Galileo,Flights,Seating,hybrid,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-12T05:11:51Z
# Updated: 2025-09-12T06:12:55Z

@regression @galileo @flights @seating @hybrid
Feature: 59831 Galileo - Free seats do not send paid seat request

  As a corporate traveler
  I want free seat selection to not trigger paid seat requests
  So that I am not charged for complimentary seats

  Scenario: Free seat added in Business class does not trigger paid seat request
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip "Business" class flight from "LON" to "LAX"
    And flight results should be available
    And I filter results by carrier "DL"
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I save and close seat map drawer
    Then the booking status should be "Pending Booking"
    And I accept Terms & Conditions
    And I hold the trip
