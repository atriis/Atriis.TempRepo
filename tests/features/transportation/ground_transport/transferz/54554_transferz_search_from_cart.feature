# Test Name: 54554 Transferz - Airport as a pick-up location in the map, airline field is prepulated and system return results after searching from cart
# Description:
# Status: Active
# Labels: Transferz Regression,search,Flights,Cart,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-21T08:40:31Z
# Updated: 2025-10-28T03:00:20Z

@regression @transportation @ground_transport @provider:transferz @cart
Feature: 54554 Transferz - Search from cart returns results with airport pickup

  As a corporate traveler
  I want Transferz to prepopulate cart search context from my booked flight
  So that I can find transfer results directly from the cart

  Scenario: Transferz search from cart returns results after adding a round trip flight
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BRU" to "BUH"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click search button from "Add ground transporation from Bucharest, Romania - Otopeni International (OTP)"
    Then I should see that pickup contains "Bucharest, Romania - Otopeni International (OTP)"
    And carrier is populated by text
    When I set drop off location to be "Radisson Blu, Calea Victoriei, Bucharest, Romania", vehicle type to be "All Vehicle Types", traveller to be 1 and click search button
    Then I wait for add to trip text to be visible
