# Test Name: Hybrid for 61170: Galileo and NDC passive booked in a single Pnr (when TMC permission selected)
# Status: Active
# Labels: Galileo,Gray Dawes,Single PNR,Hotel,hold flight,Regression,tmc role,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-23T01:56:45Z
# Updated: 2025-09-30T10:30:21Z

@regression @galileo @flights @hotel @single_pnr @tmc @hybrid
Feature: 61170 HYBRID Galileo and NDC passive booked in single PNR with TMC permission

  As a TMC agent
  I want Galileo and NDC passive segments to be booked in a single PNR
  So that the itinerary is consolidated when TMC permission is enabled

  Scenario: Hotel booked then flight held creates single PNR
    Given I am logged in as "corpSingle@pnr.gdg" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "SIN" to "ZRH" with the same dates as the hotel search
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I accept Terms & Conditions
    And I hold the trip
    Then the quote destination should contain "Flight to"
