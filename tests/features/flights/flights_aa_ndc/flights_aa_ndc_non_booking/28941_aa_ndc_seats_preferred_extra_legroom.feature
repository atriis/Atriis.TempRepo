# Test Name: 28941 AA NDC - Seats - Preferred and extra legroom seats are green and show 'Extra legroom' in the tooltip
# Description:
# Status: Active
# Labels: AA NDC Regression,Flights,Seating,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-07-15T10:41:50Z
# Updated: 2025-12-15T12:12:44Z

@to_adjust @flights @aa @ndc @seating
Feature: 28941 AA NDC - Seats - Preferred and extra legroom seats are green

  As a corporate traveler
  I want to select a seat on an AA NDC flight
  So that preferred and extra legroom seats appear in green and show the correct tooltip

  Scenario: Preferred and extra legroom seats are green and tooltip shows correct labels
    Given I am logged in as "ami" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "NYC" to "MIA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    When I hover over a green preferred extra legroom seat
    Then the seat tooltip should contain preferred and extra legroom labels
