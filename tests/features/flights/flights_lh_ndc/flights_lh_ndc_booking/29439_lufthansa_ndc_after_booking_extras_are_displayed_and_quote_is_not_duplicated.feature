# Test Name: 29439 Lufthansa NDC - After booking, 'Extras' are displayed and quote is not duplicated
# Description:
# Status: Active
# Labels: Flights,Extras,Pre Prod,Sanity,Lufthansa NDC Regression,Full Purchase,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-21T09:50:22Z
# Updated: 2025-10-21T10:48:40Z

@regression @flights @ndc @lufthansa @extras @full-purchase @sanity
Feature: 29439 Lufthansa NDC - After booking extras are displayed and quote is not duplicated

  As a corporate traveler
  I want to book a Lufthansa NDC flight and verify extras are displayed after booking
  So that I can confirm the booking shows extras and no duplicate quotes

  Scenario: Book a Lufthansa NDC one way flight and verify extras and no duplicate quotes
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "MUC" to "FRA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    When I complete the booking
    Then the quote destination should contain "Flight to"
    And the optional services extras section should be visible
    And there should be 1 elements matching css locator ".ticket-layout-container.is-flex.is-flex-direction-column.confirmed"
