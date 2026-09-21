# Test Name: 84966 Amadeus - Multi city by schedule offers every fare brand priced for the first leg
# Status: Draft
# Labels: Regression,Flights,Amadeus,New Flight Flow,By Schedule,Multi City,payload
# Owner: Sonia Sousa
# Created: 2026-09-18

# ADO Test Case ID: 84966
# Source: ADO Bug #83329 - NFF Amadeus Search by Schedule: Missing Fare Brands in Pricing Options
# for Multi-City Search. The bug's own oracle was a manual old-flow comparison; this reads what the
# airline priced instead, so the test states the rule rather than one flow's behaviour on a day.
#
# Amadeus prices the whole selection once per fare family, and each reply says which family each
# segment ended up in. Route and carrier are chosen for volume: Delta over three US legs logs around
# a hundred of those replies, minutes of downloads, where Iberia over these two logs about forty-six
# - the volume the Galileo test already reads comfortably. Airport codes, not city codes: the
# replies name airports, and a leg the payload never mentions has no ladder to compare.
#
# Only the first leg is judged: which fares a later leg displays is filtered by the fare already
# picked before it, and those rules are in the product's matrix rather than in any payload this
# suite reads. The first leg has no earlier choice constraining it.

@ado:84966
@regression @flights @amadeus @nff @by-schedule @multi-city @payload @priority:high
Feature: 84966 Amadeus - the first leg of a multi-city selection offers every fare priced for it
  As a corporate traveler selecting a multi-city itinerary by schedule
  I want each leg to offer every fare the airline priced for it
  So that no fare brand is dropped from pricing options by how the legs combine

  Scenario: The first leg of a two-leg by-schedule selection offers every priced fare
    Given I am logged in as "nff.edifactonly@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a multi-city by-schedule flight with legs "LIS-MAD, MAD-LIS"
    Then flight results should be available
    # One carrier on every leg: a leg flown by another airline is priced into that airline's
    # families, which are not the ones the first leg's cards are held to.
    When I filter results by carrier "Iberia"
    And I select one flight segment by schedule
    And I wait for the change flight button to be visible
    And I wait for select text to be visible
    And I filter results by carrier "Iberia"
    And I select one flight segment by schedule
    Then the outbound leg brand cards are displayed
    # The pricing replies name a family by its filed code; the card carries either that code or the
    # airline's description of it, so the fares are held to either form.
    When I capture the fare families described in "Amadeus4.Fare_MasterPricerTravelBoardSearch9" from Storage
    And I capture the fare ladder priced for each leg in "*Fare_InformativePricingWithoutPNR*" from Storage
    # Guards against the check passing on a trivial ladder: one fare per leg would make "every fare
    # is on screen" true of a single card.
    Then the fare ladder combinations should exceed 4
    And the displayed leg 1 should offer a brand card for every fare in its ladder
