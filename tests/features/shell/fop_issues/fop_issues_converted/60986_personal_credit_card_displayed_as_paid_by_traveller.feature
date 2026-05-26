# Test Name: 60986 FOP - Personal credit card is displayed as "Paid by traveller" text
# Description:
# Status: Active
# Labels: Regression,general,FOP,paid by,credit card,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-04-10T01:27:48Z
# Updated: 2026-02-10T05:17:20Z

@regression @flights @fop @credit-card @paid-by-traveler
Feature: 60986 FOP - Personal credit card is displayed as "Paid by Traveler"
  As a corporate traveler whose default FOP is a personal credit card
  I want to see "Paid by Traveler" in the cart payment section
  So that I know the personal card will cover the booking

  @priority:high
  Scenario: Personal credit card default FOP shows Paid by Traveler in cart
    Given I am logged in as "emillysarah@paidbytraveler.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "FRA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And the payment type should be "Paid by Traveler"
