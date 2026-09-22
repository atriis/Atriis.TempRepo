# Test Name: 84969 Amadeus NDC - the checked baggage badge matches the allowance bound to that leg
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,New Flight Flow,Branded Fares,Baggage,payload
# Owner: Sonia Sousa
# Created: 2026-09-21

# ADO Test Case ID: 84969
# Source: ADO Bug #84752 - [Flights][Amadeus NDC] we do not parse the changes, cancellations and
#         seats in pricing options screen
#
# The third dimension the bug's QA section tested, alongside the change/cancellation badges (TC
# 84967) and the seat service (TC 84968). The binding is the point, not the number: an offer can
# bind 2 pieces to the outbound journey alone and a different allowance to the return, and the
# outbound card must then show the outbound figure with the return's allowance not leaking into it.
#
# Baggage is also the control the bug's own analysis leaned on - it resolved correctly inside the
# very offer whose seat service was dropped, which is what showed the offer had been matched at all.
# A regression here would remove that ground.
#
# Read per journey from AMA_TravelOfferPriceRQ, never from the app's own response: that response
# carries the already-derived value, so a card rendered from a wrong derivation matches it.
#
# Every cabin class tab is walked, so the Business brands are covered and not only the Economy ones
# the screen opens on. Weight-based allowances are skipped: they are quoted in kilos, which is a
# different comparison. The step fails if that leaves nothing checked.

@ado:84969
@regression @flights @amadeus @amadeus-ndc @nff @branded-fares @baggage @payload
Feature: 84969 Amadeus NDC - checked baggage is shown per leg, as the airline bound it
  As a corporate traveler choosing a branded fare
  I want each brand card to show the checked allowance for the leg it belongs to
  So that an allowance bound to the other leg is neither shown here nor lost

  @priority:high
  Scenario: The checked baggage badge reflects the allowance bound to the card's own leg
    Given I am logged in as "amsnewflowama@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BUD" to "BOS"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    And the brand card checked baggage badge should match the allowance the airline bound to that leg
