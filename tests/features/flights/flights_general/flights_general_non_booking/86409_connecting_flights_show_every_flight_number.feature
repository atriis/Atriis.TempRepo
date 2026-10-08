# Test Name: 86409 Flights - Connecting flights show every flight number on the OBT flight card
# Status: Active
# Labels: Regression,Flights,Search Flight,by schedule,New Flight Flow,Amadeus
# Owner: Yael Alef
# Created: 2026-10-08

# ADO Test Case ID: 86409
# Source: ADO User Story #62878 - [Flights][OBT] Connecting flights - Display all flight numbers
#
# Behind the remote flag Atriis.App.OBT.IsConnectingFlightNumbersEnabled (Atriis.App PR #482; ON for every
# user on atriis-dev.app), the desktop flight card lists every flight number of a leg joined by " / ",
# wrapping only after a separator, with the Figma stops line ("1 Stop FRA 1h15m", "2 Stops ORD | FRA").
# Two-airline legs keep the connection icon and "Multiple Carriers" (Andre Goncalves, 2026-09-29).
# Mobile, Pricing Options and unused tickets are out of scope. Exchange (TC step 10) is manual: it needs a
# ticketed, changeable connecting trip. Verified 2026-10-08 on atriis-dev.app (trips 3925247, 3925248,
# 3925253, 3925257). Search and cart only: nothing is booked.

@ado:86409 @regression @flights @general @amadeus @priority:medium
Feature: 86409 Connecting flights show every flight number on the OBT flight card
  As a booker
  I want to see every flight number of a connecting leg, whichever airline operates each flight
  So that I understand the complete journey I am booking

  @old-flow
  Scenario: Old flow complete search - same-airline and two-airline connections, then the cart quote card
    Given I am logged in as "am@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "SEA"
    Then flight results should be available
    And every flight result leg should show all its flight numbers
    And the checked flight legs should include a "same airline 1 stop" leg
    And the checked flight legs should include a "multiple carriers 1 stop" leg
    When I add the first flight flown by "LH" to cart
    Then the cart should contain 1 flight quote
    And the cart flight quote should show all its flight numbers
    And the checked flight legs should include a "same airline 1 stop" leg

  @two-stops
  Scenario: Two-stop legs show all three flight numbers and the "2 Stops A | B" line
    # BOI-LEJ only has 2-stop prices on dev for this user (same route as TC 46669).
    Given I am logged in as "brunaauto@amadeusgds.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BOI" to "LEJ"
    Then flight results should be available
    When I filter results by the "2 stops" stops option
    Then every flight result leg should show all its flight numbers
    And the checked flight legs should include a "same airline 2 stops" leg

  @by-schedule @new-flight-flow
  Scenario: New Flight Flow by schedule - leg cards show every flight number
    Given I am logged in as "corp.amadeus.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "LIS" to "SEA"
    Then flight results should be available
    And every flight result leg should show all its flight numbers
    And the checked flight legs should include a "same airline 1 stop" leg
