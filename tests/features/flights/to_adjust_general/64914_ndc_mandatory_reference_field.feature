# Test Name: 64914 NDC - Booking is successful when NDC mandatory reference field is configured
# Status: Active
# Labels: general,Flights,Reference Fields,Checkout,NDC,AFKL NDC Regression,Full Purchase,mandatory,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-29T11:17:04Z
# Updated: 2026-02-03T05:25:52Z

@regression @flights @ndc @reference-fields @full-purchase
Feature: 64914 NDC - Booking successful with mandatory reference field
  As a corporate traveler booking an NDC flight
  I want to fill in the mandatory NDC reference field and complete the booking
  So that my booking is processed correctly

  # TODO: New user needed — marianagabi@reffieldmand.com → USER_MARIANAGABI
  # Add to .env: USER_MARIANAGABI="marianagabi@reffieldmand.com"

  Scenario: NDC booking succeeds when mandatory reference field is filled
    Given I am logged in as "marianagabi" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "PAR"
    And I add the first flight to cart
    And I proceed to checkout
    # TODO: Step needed for "Fill in NDC mandatory reference field"
    And I complete the booking
    Then I successfully cancel the trip
