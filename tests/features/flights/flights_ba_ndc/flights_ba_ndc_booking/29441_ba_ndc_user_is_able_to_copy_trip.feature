# Test Name: 29441 BA NDC - User is able to copy trip
# Description:
# Status: Active
# Labels: Flights,Fare Rules,Copy Trip,Sanity,BA NDC Regression,Full Purchase,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-05-24T03:53:51Z
# Updated: 2025-11-12T02:18:49Z

@regression @flights @ndc @ba @copy-trip @full-purchase
Feature: 29441 BA NDC - User is able to copy trip

  As a corporate traveler
  I want to book a BA NDC flight and copy the trip
  So that I can verify the copy trip functionality works correctly

  Scenario: Book a BA NDC flight and successfully copy the trip
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    And the quote destination should contain "Flight to"
    When I store the first booked flight number
    And I copy the trip
    Then the trip is created successfully with the same flight
