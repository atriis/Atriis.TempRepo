# Test Name: 84846 Sabre - NFF - Multi pax - price per pax on the pricing page matches the cart total
# Status: Draft
# Labels: Regression,Flights,Sabre,New Flight Flow,Pricing page,Multi PAX

# ADO Bug #84804 - OBT - NFF - Multi pax - Price per pax and total in cart don't match
# Severity: 1 - Major | Source system: Sabre | Feature: Pricing page | User: nffSothwest@tlg.corp
# Repro: 3 adults, BCN-VIE round trip, Austrian OS404/OS401, trip 3862322
# Austrian goes in the search form's preferred-carrier field, not a results filter: filtering
# afterwards left a separated-ticket itinerary, and the bug is about a single OS out-and-back.
# The bug: on the NEW flight flow pricing page some brand cards showed 1/3 of the per-traveller
# price (Economy Flex $144.77 instead of $434.30) while the cart charged the correct $1302.90.
# Economy Light was unaffected, so the FIRST brand card is not a safe pick here - the card must be
# chosen by brand name or the test would pass with the bug still present.

# ADO Test Case ID: 84846
@regression @flights @sabre @nff @pricing-options @multi-pax @priority:critical @ado:84804 @ado:84846
Feature: 84846 Sabre - New Flight Flow - per-pax price on the pricing page matches the cart total
  As a corporate travel arranger booking a Sabre round trip for three travellers in the new flight flow
  I want the price the brand card labels per traveller to be the fare for one traveller
  So that the cart charges that fare three times instead of nine times what the card showed

  Scenario: Brand card per-traveller price multiplied by 3 travellers equals the cart total
    Given I am logged in as "nffSothwest@tlg.corp" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "BCN" to "VIE" with preferred carrier "Austrian Air"
    Then flight results should be available

    # "Select flight" on this account opens the new flight flow brand cards, not the classic drawer
    When I select the first flight result in new flight flow
    Then the outbound leg brand cards are displayed

    # Economy Flex is the brand the bug was raised on; Economy Light priced correctly either way
    When I select the outbound brand card named "Economy Flex" from pricing options new flight flow
    And I select the inbound first option from pricing options new flight flow

    # The outbound card shows a "Starting from" price and the inbound shows a delta, so the pricing
    # page's real price per pax is the flight selection footer total once both legs are chosen
    Then the flight selection footer should display a total price per traveller
    And I extract the price per traveller from the flight selection footer

    When I add to cart from pricing options new flight flow
    Then the booking status should be "Pending booking"
    # Pinned to 3 rather than the UI-read count: the shared add-guest step's traveller count
    # under-reads on a render race, and the pax count is the whole point of this assertion.
    And the cart total price should be the last extracted price multiplied by the number of travelers 3
    Then I successfully cancel the trip
