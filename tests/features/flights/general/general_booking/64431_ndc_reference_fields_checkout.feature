# Test Name: 64431 NDC Flights - Only Reference Fields set for NDC flights are displayed in checkout
# Status: Active
# Labels: general,Flights,Reference Fields,Checkout,NDC,AFKL NDC Regression,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-15T10:19:42Z
# Updated: 2025-08-04T03:45:18Z

@regression @flights @ndc @reference-fields @checkout
Feature: 64431 NDC Flights - Only NDC reference fields displayed in checkout
  As a corporate traveler booking an NDC flight
  I want to see only NDC-specific reference fields in checkout
  So that I fill in the correct fields for NDC bookings

  Scenario: Only NDC reference fields are displayed in checkout
    Given I am logged in as "yoko" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "AMS" to "CDG"
    And I add the first flight to cart
    And I proceed to checkout
    Then the following checkout reference fields should be visible:
      | ndc only |
      | ndc and gds |
    And the following checkout reference fields should not be visible:
      | gds only |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    Then I successfully cancel the trip
