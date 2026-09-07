# Test Name: 84248 Galileo - Flights - Single PNR is created when the second flight is held
# Status: Active
# Labels: Flights,hold flight,PNR,Galileo,Regression,Single PNR
# Owner: Noam Miller
# Created: 2026-09-06

# ADO Test Case ID: 84248
# ADO workitem ID: 83180
# Bug: on the OBT hold path, holding a second flight onto a trip whose first flight was already
# ON HOLD created a brand-new PNR instead of merging into the existing one. Epic 71540 wants a
# separate PNR only when the existing flight is TICKETED. Needs the "Can add flight to existing
# PNR" permission and no split rule between the two carriers. GTP was never affected.
@ado:84248 @regression @galileo @flights @single_pnr @hold
Feature: 84248 Galileo - Single PNR created on hold

  As a corporate traveler
  I want the flight I hold to join the PNR of the flight I already held
  So that my itinerary stays in a single PNR

  Scenario: Two held flights are merged into a single PNR
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "WAW" to "AMS" in 60 days
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I accept Terms & Conditions
    And I hold the trip
    Then the quote destination should contain "Flight to"
    And I click to add a flight to my trip from cart
    When I edit the flight search from "LON" to "WAW" in 64 days
    And flight results should be available
    And I filter results by a random carrier from "KL,LO"
    And I add the first flight to cart
    Then I should see a quote with status "Pending booking"
    And I wait for 30 seconds
    And I accept Terms & Conditions
    And I hold the trip into the existing PNR
    Then the flight quotes should be merged into a single PNR
    And I successfully cancel the trip
