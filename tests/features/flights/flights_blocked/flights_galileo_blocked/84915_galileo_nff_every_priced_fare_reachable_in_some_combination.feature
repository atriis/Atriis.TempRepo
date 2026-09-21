# Source: ADO Bug #84865 - NFF Galileo multi-city by schedule: the last leg's First cabin fares
# appear in no combination. Held here until that is fixed: the assertion is correct and the failure
# it reports is real, measured on trips 3862496, 3862505 and 3862541.
#
# What it guards is the invariant the #83337 fix installed: a fare is reachable if ANY combination
# row carries it. That is the one check that covers every leg - which fares a leg displays is
# filtered by the fare picked before it, but a fare present in no row at all is lost, not filtered.
#
# Measured on JFK-LAX-ORD-DFW-JFK, the circuit the bug was found on: 104 rows, and the last leg at
# 4/6 - FIRST (2139046) and FIRST FLEXIBLE (2139045) in no row. Rotating those same four markets
# moved the loss to whichever leg ended up last, so it follows the position rather than the market.
# The circuit below avoids LAX-ORD, which failed to price separately about one run in four.

# ADO Test Case ID: 84915
@ado:84915
@regression @flights @galileo @nff @by-schedule @multi-city @payload @priority:high
Feature: 84915 Galileo - every priced fare is reachable in some combination
  As a corporate traveler selecting a multi-city itinerary by schedule
  I want every fare the airline priced to be reachable through some combination of legs
  So that no fare is lost entirely by how the combination matrix spends its budget

  Scenario: No leg of a four-leg by-schedule selection loses a fare from every combination
    Given I am logged in as "corp.galileo.nff@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city by-schedule flight with legs "JFK-LAX, LAX-DFW, DFW-ORD, ORD-JFK"
    Then flight results should be available
    # One carrier on every leg: a leg flown by another carrier gets no ladder of its own.
    When I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    When I capture the fare ladder priced for each leg in "AirPriceRsp" from Storage
    Then the fare ladder combinations should exceed 64
    And every priced fare should be reachable in some combination in "FlightPricingV3"
