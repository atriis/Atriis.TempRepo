# Test Name: 81545 [FUSION] Markup alignment - 50% MU of the whole price on Aer Lingus Economy, complete trip, 2 PAX
# Status: Draft
# Labels: Regression,Flights,Travelfusion,Regular Markup
# Source: bug 82043 - carrier + cabin criteria
# ADO Test Case ID: 82674
# ADO workitem ID: 81545
# Carrier specificity is covered by the by-schedule sibling, where each leg prices separately.

@ado:82674
@regression @flights @travelfusion @provider:travelfusion @management-fee @carrier-specific-mu
Feature: 82674 Travelfusion - Management markup of 50% of the whole price on Aer Lingus Economy for a complete trip
  As a corporate traveler on a Travelfusion configuration with a carrier-specific management markup
  I want the 50% markup calculated on the whole price of the configured carrier and cabin
  So that a single-ticket complete trip charges the marked-up amount for every passenger

  @priority:high
  Scenario: Aer Lingus LON-JFK Economy complete trip applies a 50% MU on the whole price, charged per pax for 2 PAX
    Given I am logged in as "fusion.mu1@corp.ams" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    # The configuration matches on carrier and cabin, so the search states the cabin
    When I search for a round trip "Economy" class flight from "LON" to "JFK"
    And flight results should be available

    # Aer Lingus routes LON-JFK over Dublin, so every priced segment qualifies for the markup
    And I filter results by carrier "EI"
    And I start intercepting the "flightPricing" API response
    And I click to open first pricing options
    Then the management markup on the published fare should be "50" percent of the whole price

    And I select the published fare for every direction from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"

    # One ticket, so the marked-up per-pax price x 2 travellers is the cart total exactly
    And the cart total price should equal the published fare price multiplied by the number of selected travelers
    Then I successfully cancel the trip
