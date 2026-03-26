# Test Name: 58325 Amadeus - Flight booking succeeds when traveller's name has space or period (.)
# Description:
# Status: Active
# Labels: Amadeus,Flights,Regression,hold flight,Full Purchase,traveler name,GDS,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-09T11:51:42Z
# Updated: 2025-12-11T07:18:31Z

@regression @flights @amadeus @traveler-name @hold
Feature: 58325 Amadeus - Booking succeeds with traveler name containing space or period
  As a corporate traveler
  I want to book a flight when my name contains spaces or periods
  So that special characters in names don't prevent booking

  Scenario: Book and hold flight with traveler name containing space
    Given I am logged in as "bruna_nlgov" booking a new trip
    And I have added a random guest traveler with name "Mary Jane" "De La Cruz"
    When I search for a one way flight from "PAR" to "DOH" 
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I add a credit card as payment method
    And I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
