# Test Name: 56765 conflicting quote should appear on price check
# Status: Active
# Labels: Regression,Flights,Check price,conflicting quote,2026 plan 1
# Owner: Shani Hadar
# Created: 2025-01-15T10:19:00Z
# Updated: 2025-10-13T06:33:55Z

@regression @flights @general @check-price @conflicting-quote
Feature: 56765 Flights - Conflicting quote should appear on price check
  As a corporate traveler
  I want to see a conflicting quote notification on price check
  So that I am aware of overlapping bookings

  Scenario: Conflicting quote appears on price check after cancellation
    Given I am logged in as "shani_nl" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Create first trip (search, add, navigate to cart)"
    When I book a new trip
    And I have added myself as the traveler
    And I search for a round trip flight from "LON" to "DOH"
    And I fill in NL reference fields education and courses
    And I add the first flight to cart
    # TODO: Step needed for "Cancel quote from cart before checkout"
    # TODO: Step needed for "Click show cancelled items"
    # TODO: Step needed for "Click check price on cancelled quote and verify conflicting quote modal appears"
