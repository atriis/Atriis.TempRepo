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
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added myself as the traveler
    And I search for a round trip flight from "LON" to "DOH"
    And I fill in NL reference fields education and courses
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I close tab 2
    When I book a new trip
    And I have added myself as the traveler
    And I search for a round trip flight from "LON" to "DOH"
    And I fill in NL reference fields education and courses
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then I successfully cancel the quote
    When I show cancelled items
    And I click check price and proceed on the first cancelled quote
    Then the conflicting quote modal should be visible
