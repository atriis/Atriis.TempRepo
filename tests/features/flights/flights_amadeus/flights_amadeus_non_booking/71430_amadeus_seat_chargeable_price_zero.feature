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
    Given I am logged in as "seatzero@corp.atpi" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "DFW" to "EWR"
    And flight results should be available
    And I filter results by carrier "AA"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit extras at index 3
    Then seat selection should be restricted with message "Chargeable seat selection not available"