# Test Name: 64917 GDS - Booking is successful when GDS mandatory reference field is configured
# Status: Active
# Labels: general,Flights,Reference Fields,Checkout,Full Purchase,GDS,mandatory,Amadeus,Regression,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-29T01:30:40Z
# Updated: 2026-02-03T05:26:31Z

@regression @flights @gds @reference-fields @full-purchase @amadeus
Feature: 64917 GDS - Booking successful with mandatory reference field
  As a corporate traveler booking a GDS flight
  I want to fill in the mandatory GDS reference field and complete the booking
  So that my booking is processed correctly

  Scenario: GDS booking succeeds when mandatory reference field is filled
    Given I am logged in as "lolalohan" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "GRU"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I fill in the "GDS ONLY" reference field with "def"
    And I complete the booking
    Then the quote destination should contain "Flight to"
