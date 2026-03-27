# Test Name: 65439 LCC - Booking is successful when LCC mandatory reference field is configured
# Status: Active
# Labels: Regression,Flights,Full Purchase,Low cost,general,Fusion,Reference Fields,mandatory,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-29T01:05:39Z
# Updated: 2026-02-03T05:27:05Z

@regression @flights @lcc @reference-fields @full-purchase @fusion
Feature: 65439 LCC - Booking successful with mandatory reference field
  As a corporate traveler booking an LCC flight
  I want to fill in the mandatory LCC reference field and complete the booking
  So that my booking is processed correctly

  # TODO: New user needed — shawg@fusionmandatoryref.com → USER_SHAWG
  # Add to .env: USER_SHAWG="shawg@fusionmandatoryref.com"

  Scenario: LCC booking succeeds when mandatory reference field is filled
    Given I am logged in as "shawg" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And I add the first flight to cart
    And I fill credit card cvv if needed
    And I proceed to checkout
    # TODO: Step needed for "Fill in LCC mandatory reference field"
    And I complete the booking
