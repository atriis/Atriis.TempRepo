# Test Name: 85640 Amadeus NDC - every brand the airline offers is shown on pricing options with its details
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,New Flight Flow,Branded Fares,payload
# Owner: Yael Alef
# Created: 2026-09-29

# ADO Test Case ID: 85640
# Source: ADO Bug #85493 - Amadeus NDC brand details lookup fails and brands lose details on
#         Pricing Options
#
# The brand-details lookup behind each card cleaned up a session it never opened, threw, and the
# caller dropped that brand from the screen without saying so. The oracle is the supplier payload:
# every brand the Amadeus NDC offers carry on the outbound leg must have a card, on whichever cabin
# tab it lives, and the card must show its feature badges. Outbound only - the return cards depend
# on the outbound brand picked.
#
# Air France CDG-AMS is the bug's own itinerary: its NDC offer carries Basic to Business Flex.

@ado:85640
@regression @flights @amadeus @amadeus-ndc @nff @branded-fares @payload
Feature: 85640 Amadeus NDC - every offered brand is shown on pricing options
  As a corporate traveler choosing a branded Air France NDC fare
  I want every brand the airline offers to appear on pricing options with its details
  So that no fare is silently missing from the comparison

  @priority:high
  Scenario: Every Air France NDC brand on the outbound leg has a brand card with details
    Given I am logged in as "amsnewflowama@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "CDG" to "AMS"
    Then flight results should be available
    When I filter results by carrier "Air France"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And every brand the airline offered on the outbound leg should have a brand card with details
