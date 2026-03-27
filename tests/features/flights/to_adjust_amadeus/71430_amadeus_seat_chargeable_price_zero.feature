# Test Name: 71430: Amadeus (OBT) - When seat is chargeable but price is 0/no price in xml, prevent seat selection
# Description:
# Status: Active
# Labels: Amadeus,ATPI,Seating,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-12-14T03:08:20Z
# Updated: 2025-12-14T03:50:07Z

@regression @flights @amadeus @seating
Feature: 71430 Amadeus - Seat chargeable with price 0 prevents seat selection
  As a corporate traveler
  I want seat selection to be prevented when chargeable seats have no price
  So that I am not charged unexpected amounts

  Scenario: Chargeable seat with price 0 shows restriction tooltip
    Given I am logged in as "seat_zero" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DFW" to "EWR"
    And I wait for add to trip text to be visible
    And I filter results by carrier "AA"
    And I add the first flight to cart
    # TODO: Validate seat selection restricted
    # Testim flow: open seating panel → click "Add Seats" → hover a seat →
    # verify tooltip: "Chargeable seat selection not available, try at check in or with the airline"
    # for BOTH outbound and inbound segments
    # Need new step: Then seat selection should be restricted with chargeable message
    # DSL: Cart.validateSeatSelectionRestricted(page) → CartPage selectors for seating panel + tooltip
    Then I successfully cancel the trip
