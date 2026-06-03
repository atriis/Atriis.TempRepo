# Test Name: 31331 New UI - Optional services are loading on cart page
# Description:
# Status: Active
# Labels: Regression,Flights,Optional Services,Cart,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-06-05T02:15:01Z
# Updated: 2024-07-30T02:49:09Z

@regression @shell @flights @cart @optional-services
Feature: 31331 - Optional services are loading on cart page
  As a travel arranger
  I want the optional services (Frequent Flyer, Meal, Seating) to load on the cart page
  So that travelers can configure their flight extras before booking

  @priority:medium
  Scenario: Optional services sections are displayed in the cart after adding a flight
    Given I am logged in as "testim@prof.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LHR" to "FRA"
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the "Frequent Flyer" section should be visible in the extras
    And the "Meal" section should be visible in the extras
    And the "Seating" section should be visible in the extras
    And I successfully cancel the trip
