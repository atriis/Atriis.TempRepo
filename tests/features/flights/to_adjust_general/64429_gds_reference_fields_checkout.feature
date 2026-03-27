# Test Name: 64429 GDS Flights - Only Reference Fields set for GDS (EDIFACT) flights are displayed in checkout
# Status: Active
# Labels: Regression,general,Flights,Reference Fields,GDS,Checkout,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-15T09:02:21Z
# Updated: 2025-07-15T10:16:43Z

@regression @flights @general @reference-fields @gds @checkout
Feature: 64429 GDS Flights - Only GDS reference fields displayed in checkout
  As a corporate traveler booking a GDS flight
  I want to see only GDS-specific reference fields in checkout
  So that I fill in the correct fields for EDIFACT bookings

  # TODO: New user needed — georgebush@reffieldsgds.com → USER_GEORGEBUSH
  # Add to .env: USER_GEORGEBUSH="georgebush@reffieldsgds.com"

  Scenario: Only GDS reference fields are displayed in checkout
    Given I am logged in as "georgebush" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "PAR" to "GRU"
    And I add the first flight to cart
    And I proceed to checkout
    # TODO: Step needed for "Verify only GDS reference fields are displayed (not NDC or LCC fields)"
    Then I successfully cancel the trip
