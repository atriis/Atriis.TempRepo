# Source: ADO Bug #83321 - NFF Galileo Search by Schedule: Missing Fare Brands in Pricing Options.
# Sanity companion to the multi-city scenario: the same rule on the simplest by-schedule shape, so
# a failure there can be read as "wide selections break" rather than "by-schedule pricing breaks".
#
# No combination cap guard here, and deliberately: two legs cannot produce enough combinations to
# reach it, so claiming the cap bites would be false. This scenario checks the rule holds in the
# ordinary case; the multi-city one covers the capped regime.
#
# SCOPE: the outbound leg only, for the same reason as the multi-city scenario - the return leg is
# filtered by which fares combine with the outbound fare already picked, and those rules are in the
# product's matrix rather than in any payload this suite can read.

# ADO Test Case ID: 84860
@ado:84860
@regression @flights @galileo @nff @by-schedule @payload @priority:medium
Feature: 84860 Galileo - the outbound leg of a by-schedule round trip offers every fare priced for it
  As a corporate traveler searching by schedule
  I want the leg I am choosing to offer every fare the airline priced for it
  So that pricing options never hides a fare brand the supplier sold

  Scenario: The outbound leg of a by-schedule round trip offers every priced fare
    Given I am logged in as "corp.galileo.nff@gdg.com" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "JFK" to "LAX"
    Then flight results should be available
    When I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "American Airlines"
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    When I capture the fare ladder priced for each leg in "AirPriceRsp" from Storage
    Then the displayed leg 1 should offer a brand card for every fare in its ladder
