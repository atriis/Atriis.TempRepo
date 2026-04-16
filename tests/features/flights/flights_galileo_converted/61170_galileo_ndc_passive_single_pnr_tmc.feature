# Test Name: Hybrid for 61170: Galileo and NDC passive booked in a single Pnr (when TMC permission selected)
# Status: Active
# Labels: Galileo,Gray Dawes,Single PNR,Hotel,hold flight,Regression,tmc role,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-23T01:56:45Z
# Updated: 2025-09-30T10:30:21Z

@regression @galileo @flights @hotel @single_pnr @tmc @hybrid
Feature: 61170 Galileo and NDC passive booked in single PNR with TMC permission

  As a TMC agent
  I want Galileo and NDC passive segments to be booked in a single PNR
  So that the itinerary is consolidated when TMC permission is enabled

  Scenario: Hotel booked then flight held creates single PNR
    Given I am logged in as "corpsingle_pnr" booking a new trip
    And I have added a random guest traveler
    # Hotel booking
    # TODO: Search_hotel_and_add_to_cart — search hotel 1 night in "AMS", add refundable room to cart
    # Expand: Search_hotel_1_night('AMS') + add_hotel_from_search_results_to_cart()
    And I proceed to checkout
    And I complete the booking
    # Flight from trip cart
    # TODO: Go_to_trip_cart__search_flights — click "Go to trip", then search one way flight LHR→AMS from cart
    # TODO: Add_flight_to_cart_and_checkout — add first flight, accept T&C, hold
    # Verify single PNR across hotel and flight quotes
    Then the booking status should be "On hold"
