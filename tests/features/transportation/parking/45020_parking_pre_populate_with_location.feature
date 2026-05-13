# Test Name: 45020 Parking - Airport Parking pre populate with location
# Description: Adjust this test after bug 53809 is fixed. It is prepopulated with location, but location is not complete. Search from cart works as expected.
# Status: Active
# Labels: Regression,UK Parking,search,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-24T09:28:55Z
# Updated: 2024-10-30T01:21:22Z

@regression @transportation @parking @search
Feature: 45020 Parking - Airport parking search is pre-populated with flight departure airport

  As a corporate traveler
  I want the parking search to be pre-populated with my booked flight's departure airport
  So that I do not need to re-enter airport details when adding parking to my trip

  Scenario: Parking search is pre-populated with Heathrow after booking a LHR departing flight
    Given I am logged in as "anamaria@ukparking.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "MAD"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click the parking tab in the cart trip bar
    Then the parking search should be pre-populated with airport "Heathrow"
    When I close the parking search panel
    Then I successfully cancel the trip
