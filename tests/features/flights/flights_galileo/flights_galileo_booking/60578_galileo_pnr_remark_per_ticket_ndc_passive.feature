# Test Name: Hybrid for 60578 - Galileo - Pnr Remark sent per ticket, NDC booking with passive segment
# Status: Active
# Labels: Gray Dawes,Lufthansa NDC Regression,Flights,hybrid,Passive Pnr,multi pax,2026 plan 2
# Owner: Noam Miller
# Created: 2025-04-06T08:51:29Z
# Updated: 2026-01-06T07:58:22Z

@regression @galileo @flights @ndc @passive_pnr @multi_pax @hybrid
Feature: 60578 Galileo - PNR remark sent per ticket NDC with passive segment

  As a corporate traveler
  I want PNR remarks to be sent per ticket in NDC bookings with passive segments
  So that each ticket has the correct remark attached

  Scenario: NDC booking with 2 travelers generates ticket numbers per PNR remark
    Given I am logged in as "ndc@passive.gdg" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "FRA" to "WAW"
    And flight results should be available
    And I add the first flight to cart
    Then the booking status should be "Pending Booking"
    And I proceed to checkout
    And I complete the booking
    Then the quote destination should contain "Flight to"
    When I open flight details in cart
    Then the flight details ticket numbers should start with "220" for both travelers
