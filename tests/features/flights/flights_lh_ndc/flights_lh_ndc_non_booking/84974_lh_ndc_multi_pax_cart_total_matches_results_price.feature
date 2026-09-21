# Test Name: 84974 Lufthansa NDC - Multi pax - Cart total is the results page price per traveller
# Status: Active
# Labels: Regression,Flights,LH NDC,Lufthansa,NDC,Multi Pax,Pricing
# Owner: Bruna Santos
#
# Domain: Flights | Supplier: Lufthansa NDC | Flow: classic results card -> Add to trip
# Route: FRA -> ZRH one way, 2 travellers (self + one random guest).
# FRA-ZRH is also served by LX and by EDIFACT LH fares, so an unfiltered search can green-light
# this test on a flight that never touched the NDC connection. The carrier filter plus the
# "NDC direct rate" label pin the offer to LH NDC before any price is read.
# The results-card price is the one that reaches the cart: addFirstFlightToCart clicks "Add to
# trip" on the card directly and does NOT re-price through pricing options.
# The traveller count is written as the literal 2 rather than read from the UI - the
# "number of selected travelers" variant reads this.selectedTravelerCount, which under-reads on a
# render race and would silently compare 1x and pass if a guest failed to be added.

@regression @flights @ndc @lufthansa @multi-pax @pricing @priority:high @tc:84974
Feature: 84974 Lufthansa NDC - Multi pax cart total is the results price multiplied by number of travellers

  As a corporate travel arranger booking a Lufthansa NDC flight for two travellers
  I want the cart total to be the price shown in the results page multiplied by the traveller count
  So that I can confirm the results price is per traveller and the cart charges it once per passenger

  Scenario: LH NDC flight for 2 travellers - cart total is the results price x 2
    Given I am logged in as "claraaguiar@ndclhclara.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    When I search for a one way flight from "FRA" to "ZRH"
    And flight results should be available
    When I extract the price from first flight result
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    Then the cart total price should be the last extracted price multiplied by the number of travelers 2
