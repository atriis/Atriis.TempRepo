# Test Name: 66658 Trip Overview - Suggested car search form is displayed after a flight is added to the cart
# Description:
# Status: Active
# Labels: Regression,Cart,multiproducts,general,Flights,Cars,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-09T03:54:30Z
# Updated: 2025-12-24T06:20:48Z

@regression @shell @multiproducts @flights @cars
Feature: 66658 Shell - Suggested car search form is displayed after a flight is added to the cart
  As a corporate traveler who has just added a flight
  I want the trip overview to suggest a matching car rental search
  So that I can add ground transport for the same destination in one flow

  Scenario: Adding a flight surfaces a pre-filled car search suggestion for the destination
    Given I am logged in as "new@guy33.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAN"
    And I click proceed button if visible
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the suggested car rental cross-sell should be displayed
    When I open the suggested car search form
    Then the car search form should be displayed
    Then the car search form destination should be "MAN"
