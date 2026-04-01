# Test Name: 45589 NDC - Trip overview - More Details
# Status: Active
# Labels: Flights,Regression,Iberia,Full Purchase,price,progress page,2026 plan 1
# Owner: pini harush
# Created: 2024-05-01T03:42:43Z
# Updated: 2026-02-10T05:08:44Z

@regression @flights @ndc @iberia @full-purchase
Feature: 45589 NDC Iberia - Trip overview more details
  As a corporate traveler
  I want to see flight details in the trip overview after booking
  So that I can verify traveler, ticket, FF, meal, and seat information

  Scenario: Trip overview shows detailed flight information after booking
    Given I am logged in as "iberia" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MAD" to "LON"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I open flight details in cart
    Then the flight details table headers should be visible
    And seat selection should be available from flight details
