# Test Name: 54554 Transferz - Airport as a pick-up location in the map, airline field is prepulated and system return results after searching from cart
# Description:
# Status: Active
# Labels: Transferz Regression,search,Flights,Cart,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-21T08:40:31Z
# Updated: 2025-10-28T03:00:20Z
# TODO: add USER_ALANA_TRANSFERZ for alana@transferzandflight.com before running this scenario.

@regression @transportation @ground_transport @provider:transferz @cart
Feature: 54554 Transferz - Search from cart returns results with airport pickup

  As a corporate traveler
  I want Transferz to prepopulate cart search context from my booked flight
  So that I can find transfer results directly from the cart

  Scenario: Transferz search from cart returns results after adding a round trip flight
    Given I am logged in as "alana_transferz" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRU" to "BUH"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I search transferz from cart and validate results are displayed
