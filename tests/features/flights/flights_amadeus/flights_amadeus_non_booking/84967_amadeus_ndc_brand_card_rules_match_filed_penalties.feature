# Test Name: 84967 Amadeus NDC - brand card change and cancellation badges match the filed penalties
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,New Flight Flow,Branded Fares,payload
# Owner: Sonia Sousa
# Created: 2026-09-20

# ADO Test Case ID: 84967
# Source: ADO Bug #84752 - [Flights][Amadeus NDC] we do not parse the changes, cancellations and
#         seats in pricing options screen
#
# The oracle is the supplier payload, not the app's own FlightPricingSelection response. That
# response carries the values the app already derived, so a card rendered from a wrong derivation
# matches it perfectly - only AMA_TravelOfferPriceRQ says what the airline actually filed. This is
# what separates this test from 80994, which cross-checks the same cards against the app's response.
#
# The badge the bug is about is the one shown when nothing was filed. The front end renders "no
# info" as "check fare rules"; rendering "Non-refundable" / "Changes not allowed" instead is the
# defect, and it fails in the risky direction - it tells a traveller a fare is locked when nothing
# is known about it. The filed change fee is asserted in the same pass so the test still proves
# something on a day when the airline files rules for every brand.
#
# Brands whose offers disagree on what was filed are skipped rather than guessed at: there is no way
# to know which offer fed the card. The step fails if that leaves nothing checked.
#
# Outbound cards only, every cabin tab of them. The front end builds these two badges from the
# pricing option package, not per segment the way it builds seat and baggage, so once an outbound
# brand is picked the return cards quote the chosen combination's rule rather than the return
# leg's own - measured, with Light picked outbound the return Standard card reads 300.00 where the
# airline filed 150 for that leg. Whether that is intended is a product question, so this asserts
# only where the expected behaviour is documented. Seat (84968) and baggage (84969) cover both legs.

@ado:84967
@regression @flights @amadeus @amadeus-ndc @nff @branded-fares @payload
Feature: 84967 Amadeus NDC - brand card rules reflect the penalties the airline filed
  As a corporate traveler choosing a branded fare
  I want each brand card to show the change and cancellation rules the airline filed for it
  So that I am not told a fare is non-changeable when the airline filed nothing about it

  @priority:high
  Scenario: Change and cancellation badges reflect the NDC penalties, per brand and per leg
    Given I am logged in as "amsnewflowama@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BUD" to "BOS"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the brand card change and cancellation badges should match the penalties the airline filed
