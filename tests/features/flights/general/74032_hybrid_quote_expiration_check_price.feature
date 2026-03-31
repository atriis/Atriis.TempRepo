# Test Name: Hybrid for 74032: Quote expiration - New search initiated on Check Price, dates match original search
# Status: Active
# Labels: Expiry,Amsalem,Flights,search,Regression,Amadeus NDC
# Owner: Noam Miller
# Created: 2026-02-22T06:47:52Z
# Updated: 2026-02-22T07:46:00Z

@regression @flights @general @check-price @expiry
Feature: 74032 Flights - Quote expiration new search matches original dates
  As a corporate traveler
  I want the new search initiated on check price to match the original search dates
  So that I can rebook the same itinerary

  Scenario: New search on check price uses original search dates
    Given I am logged in as "quote_expire" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "AMS" to "SFO"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"