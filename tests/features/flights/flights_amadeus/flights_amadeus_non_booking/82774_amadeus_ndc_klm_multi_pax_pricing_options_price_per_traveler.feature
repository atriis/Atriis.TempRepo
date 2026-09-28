# ADO Bug #81292 - OBT / Amadeus NDC - multi-pax price shown per-traveller but is the total
# Severity: 1 - Major | Priority: 2 | Source system: Amadeus NDC | Carrier: KLM
# Repro route: AMS-BER-AMS, 2 travellers, KL 1777 / KL 1770 Standard fare
# Fix: backend now returns the per-pax fare instead of the all-pax total

# ADO Test Case ID: 82774
@ado:82774
@regression @flights @amadeus @ndc @multi-pax @pricing-options @priority:critical
Feature: 82774 Amadeus NDC - Multi-pax per-traveller price is the fare for one traveller, not the pair total
  As a corporate travel arranger booking a KLM NDC round trip for two travellers
  I want the price labelled per traveller to be the amount for a single traveller
  So that the cart charges that fare twice instead of showing the two-pax total up front

  Scenario: KLM NDC per-traveller price for 2 travellers multiplies into the cart total
    Given I am logged in as "matteo.luca@ams.amadeus.ndc" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "AMS" to "BER"
    Then flight results should be available
    When I filter results by carrier "KLM"
    Then the "NDC Direct Rate" indicator should be visible in results

    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed

    # Take the cheapest fare on each leg
    When I select the outbound first option from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow

    # The outbound card shows a "Starting from" price and the inbound a delta, so the per-traveller
    # price for the chosen pair is the flight selection footer total once both legs are picked
    Then the flight selection footer should display a total price per traveller
    And I extract the price per traveller from the flight selection footer
    When I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"

    # The bug: the per-traveller price was already the two-pax total, so the cart matched it 1:1.
    # Pinned to 2 rather than the UI-read count, which under-reads on a render race.
    And the cart total price should be the last extracted price multiplied by the number of travelers 2
    When I save the current flight cart total for checkout comparison
    And I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for 2 travelers
    When I close price breakdown modal
    Then I successfully cancel the trip
