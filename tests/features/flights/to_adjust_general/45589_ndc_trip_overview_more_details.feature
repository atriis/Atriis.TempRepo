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
    And I proceed to checkout
    And I complete the booking
    When I click to open flight details
    # TODO: Step needed for "Verify flight details table headers: Traveler, Ticket number, FF, Meal, Seat"
    # TODO: Step needed for "Verify seat selection is available from trip overview"
