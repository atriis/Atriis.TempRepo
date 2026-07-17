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
    Given I am logged in as "pini@gov.nl" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "MAN"
    And I click proceed button if visible
    And I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"
    # TODO: verify the "Add car rental in <city>" cross-sell suggestion is shown on the trip overview — CarSearch.verifySuggestedCarCrossSellDisplayed
    Then the suggested car rental cross-sell should be displayed
    # TODO: click the cross-sell suggestion action to open the pre-filled car search form — CarSearch.openSuggestedCarSearchForm
    When I open the suggested car search form
    # TODO: verify the car search drawer/form is displayed (has the "Drop-off at a different location" option) — CarSearch.verifyCarSearchFormDisplayed
    Then the car search form should be displayed
    # TODO: verify the car search form destination is pre-filled with the flight destination — CarSearch.verifyCarSearchFormDestination
    Then the car search form destination should be "MAN"
