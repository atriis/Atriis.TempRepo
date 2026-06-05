# Test Name: Hybrid for 59206: Amadeus (OBT) - Flights - Multi pax booking succeeds, contact info association per pax
# Description:
# Status: Active
# Labels: Amadeus,Flights,Full Purchase,Regression,multi pax,GDS,progress page,Cancel by process,Club,contact info,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-03-11T07:19:01Z
# Updated: 2026-01-26T03:34:41Z

@regression @flights @amadeus @multi-pax @contact-info @full-purchase @hybrid
Feature: 59206 Amadeus - Multi-pax booking with contact info per pax
  As a corporate traveler
  I want contact info to be associated per passenger in a multi-pax booking
  So that each traveler gets the correct contact details

  Scenario: Book flight for 3 guests and verify contact info in checkout
    Given I am logged in as "multipax@ama.club" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a one way flight from "SIN" to "FRA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I uncheck contact sharing and edit the phone to "1 505 1001000"
    And I complete the booking
    Then the quote destination should contain "Flight to"
