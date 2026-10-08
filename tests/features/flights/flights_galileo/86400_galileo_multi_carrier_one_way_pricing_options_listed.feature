# Test Name: 86400 Galileo - Pricing options list fares for a one-way multi-carrier single-ticket itinerary
# Status: Active
# Labels: Regression,Flights,Galileo,Pricing Options,multicarrier,New Flight Flow
# Owner: Yael Alef
# Created: 2026-10-08

# ADO Test Case ID: 86400
# Source: ADO Bug #85733 - [Flights][Galileo] New Pricing Options screen shows "No results available" for a priced
# multi-carrier itinerary
#
# On a one-way trip a whole-journey single-ticket fare (VN11 + AF1686) has one segment, while the same flights
# sold as separate per-carrier tickets have two. TMC2 judged fares by segment count, so it dropped the single-ticket
# fare and then rejected the two-segment combinations: the new screen got an empty list ("No results available"),
# and the old screen mixed row shapes so "Add to trip" never appeared. Fixed in GTPFlightRuleEngine and
# FlightSearchHelperV3 (881fb53f81) and TMC2 PR 27061.
# Verified 2026-10-08 on atriis-dev.app: trips 3925081 (new flow) and 3925085 (old screen). No checkout:
# nothing is booked.
@ado:86400 @regression @galileo @flights @pricing-options @multicarrier
Feature: 86400 Galileo - Pricing options list fares for a one-way multi-carrier single-ticket itinerary
  As a corporate traveler searching a one-way trip on two carriers sold as one ticket
  I want the pricing options to list the fares Galileo priced
  So that I can add the flight to my trip instead of seeing "No results available"

  @nff
  Scenario: New flight flow lists brand cards for a Multi carrier SGN-EDI one way
    Given I am logged in as "corp.galileo.nff@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "SGN" to "EDI" in 30 days
    And flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    And I select the first flight result in new flight flow
    And I select the outbound first option from pricing options new flight flow
    And I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"

  Scenario: Old pricing options screen offers fares and Add to trip for a Multi carrier SGN-EDI one way
    Given I am logged in as "beatrizpamplonacorp@galileo.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "SGN" to "EDI" in 30 days
    And flight results should be available
    And I filter airline results by "Multi carrier" checkbox
    And I click to open first pricing options
    Then the pricing options leg should offer more than one fare
    When I select the first option from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"
