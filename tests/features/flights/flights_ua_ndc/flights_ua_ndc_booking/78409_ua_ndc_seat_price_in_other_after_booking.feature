# Test Name: 78409 UA NDC - Seat price in "Other" element matches before and after booking
# Description: Add travelers, search round trip DEN-BOS, add to cart, select seats for all travelers on all segments, extract seat price from "Other" in price breakdown, checkout, then verify the "Other" price matches after booking
# Status: Active
# Labels: UA NDC,Flights,Seating,Regression,price,Other,Booking,multi pax,2026 plan 2
# Owner: Noam Miller
# Created: 2026-06-01T00:00:00Z

@regression @flights @united @ndc @seating @price @booking @multi-pax
Feature: 78409 UA NDC - Seat price in "Other" matches before and after booking
  As a corporate traveler
  I want to verify that the seat price shown in the "Other" element of the price breakdown before booking
  matches the "Other" price after booking is completed
  So that I can confirm seat charges are accurately reflected throughout the booking process

  Scenario: Seat price in Other element is consistent before and after booking
    Given I am logged in as "traveler@uandc.ams" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "DEN" to "BOS"
    Then flight results should be available
    When I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    When I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I select the first available flight seat
    And I select the first available flight seat
    And I click next flight button
    And I wait for the seat map to load
    And I select the first available flight seat
    And I select the first available flight seat
    And I select the first available flight seat
    And I save and close seat map drawer
    When I click to open price breakdown in cart
    And I extract the Other price from price breakdown
    Then the extracted price at index 0 should be greater than 0
    And I close price breakdown modal
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Ticketing Complete"
    When I click to open price breakdown in cart
    And I extract the Other price from price breakdown
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
    And I close price breakdown modal
    Then I successfully cancel the trip
