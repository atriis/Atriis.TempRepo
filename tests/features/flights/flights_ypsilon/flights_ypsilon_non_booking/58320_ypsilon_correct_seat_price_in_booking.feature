# Test Name: HYBRID for 58320 Ypsilon - Correct seat price is passed in booking request
# Description:
# Status: Active
# Labels: Ypsilon,hybrid,Flights,Seating,Regression,Full Purchase,progress page,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-13T07:05:30Z
# Updated: 2025-10-16T02:13:55Z

@regression @flights @ypsilon @seating @full-purchase @hybrid
Feature: 58320 Ypsilon - Correct seat price is passed in booking request
  As a corporate traveler using Ypsilon
  I want the correct seat price to be included when booking
  So that the seat selection cost is accurately reflected in the booking

  Scenario: Seat price is correctly passed during booking with Ypsilon 3DS verification
    Given I am logged in as "gabitom@ypsilondisplaycurrency.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "DUB"
    And I filter results by carrier "EI"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I save and close seat map drawer
    Then the yellow seat indicator should be visible after saving seats
    When I proceed to checkout
    When I complete the booking with Ypsilon credit card verification
    Then the booking status should be "Ticketing Complete"
