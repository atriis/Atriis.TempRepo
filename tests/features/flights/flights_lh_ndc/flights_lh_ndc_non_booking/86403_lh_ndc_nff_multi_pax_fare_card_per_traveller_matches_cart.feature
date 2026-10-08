# Test Name: 86403 LH NDC - New Flight Flow - Multi pax - fare card per-traveller price x travellers equals the cart total
# Status: Active
# Labels: Regression,Flights,LH NDC,Lufthansa,NDC,New Flight Flow,Pricing page,Multi Pax
# Source: ADO Bug #86301 - LH NDC cart multiplies the all-passenger fare by the traveller count again
# ADO Test Case ID: 86403
# ADO workitem ID: 86301
#
# Domain: Flights | Supplier: Lufthansa NDC (Farelogix, SourceSystem LUFTHANSA) | Flow: new flight flow pricing page -> Add to cart (no booking)
# Repro: 2 travellers, BCN-BRU round trip, Brussels Airlines Economy, trip 28117274.
# The bug: since TMC2 #83474 the flightPricing response's pricing.total is already one traveller's price, but
# the OBT pricing page still divided it by the traveller count (#84674). The brand card and footer showed
# EUR 114.25 "per traveller" while the cart correctly charged 228.51 x 2, so the cart looked doubled.
# Fixed in Atriis.App PR #486: the card now shows pricing.total as is. With the bug back, footer x N is
# 1/N of the cart total and this check fails.
# The outbound card shows "Starting from" and the inbound a delta, so the per-traveller price of the chosen
# pair is the footer total once both legs are picked.
# The traveller count is written as a literal: the "number of selected travelers" variant reads a UI count
# that under-reads on a render race and would compare 1x and pass if a guest failed to be added.

@ado:86403
@regression @flights @ndc @lufthansa @nff @pricing-options @multi-pax @priority:critical
Feature: 86403 Lufthansa NDC - New Flight Flow - per-traveller fare card price multiplies into the cart total
  As a corporate travel arranger booking a Lufthansa Group NDC round trip for several travellers in the new flight flow
  I want the price the brand card labels per traveller to be the fare for one traveller
  So that the cart charges that fare once per traveller and matches what the card showed

  Scenario: LH NDC BCN-BRU for 2 travellers - footer per-traveller price x 2 equals the cart total
    Given I am logged in as "corp.lhndc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "BCN" to "BRU"
    Then flight results should be available

    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And I extract the price per traveller from the flight selection footer

    When I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    And the cart total price should be the last extracted price multiplied by the number of travelers 2
    Then I successfully cancel the trip

  Scenario: LH NDC BCN-BRU for 3 travellers - footer per-traveller price x 3 equals the cart total
    Given I am logged in as "corp.lhndc.nff@amsalem.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "BCN" to "BRU"
    Then flight results should be available

    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed
    When I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow
    Then the flight selection footer should display a total price per traveller
    And I extract the price per traveller from the flight selection footer

    When I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    And the cart total price should be the last extracted price multiplied by the number of travelers 3
    Then I successfully cancel the trip
