# Test Name: 84968 Amadeus NDC - a granted seat service is shown even when the offer spans two brands
# Status: Active
# Labels: Regression,Flights,Amadeus,Amadeus NDC,New Flight Flow,Branded Fares,payload
# Owner: Sonia Sousa
# Created: 2026-09-20

# ADO Test Case ID: 84968
# Source: ADO Bug #84752 - [Flights][Amadeus NDC] we do not parse the changes, cancellations and
#         seats in pricing options screen
#
# The second defect reported on the bug, after the first fix: a fare including free seat selection
# advertised "seat not included". Both cases that reproduced it were priced across two brand names
# (Premium Flex out + Flex back, Business Flex out + Flex back), so resolving a single brand name
# for the offer returned nothing and the seat service was dropped - while the baggage of the very
# same offer resolved fine. Cabin was ruled out on the bug: one case was pure Business.
#
# The seat service is read from the supplier payload rather than assumed from the brand name: the
# airline decides which brands include it, and that changes without notice. A brand is only checked
# when every offer carrying it grants the seat on every segment of the leg, so a partial grant never
# turns into a false failure. The step fails if that leaves nothing checked.
#
# Both legs are read, and every cabin tab of each. The return leg's cards only render once an
# outbound brand is picked, and which return fares are then offered follows that pick - picking
# Flex is what puts the seat-granting brands on the return leg, where the same defect would show
# up independently of the outbound. Without it the return leg only ever offers fares that grant no
# seat at all, and half the product goes unjudged.

@ado:84968
@regression @flights @amadeus @amadeus-ndc @nff @branded-fares @payload
Feature: 84968 Amadeus NDC - a granted seat service is shown on the brand card
  As a corporate traveler choosing a branded fare
  I want a fare that includes seat selection to say so on its card
  So that an offer priced across two brands does not hide what it includes

  @priority:high
  Scenario: The seat badge reflects the seat service the airline granted for the brand
    Given I am logged in as "amsnewflowama@ra.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BUD" to "BOS"
    Then flight results should be available
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound brand card named "Flex" from pricing options new flight flow
    Then the brand card seat badge should match the seat service the airline granted
