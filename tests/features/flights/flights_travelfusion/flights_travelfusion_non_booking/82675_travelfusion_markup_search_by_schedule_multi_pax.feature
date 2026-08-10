# Test Name: 81545 [FUSION] Markup alignment - 50% MU on the selected flight carried into cart for 3 PAX
# Status: Draft
# Labels: Regression,Flights,Travelfusion,Regular Markup
# Source: bug 81937 - EI outbound + DE inbound, separated tickets
# ADO Test Case ID: 82675
# ADO workitem ID: 81545
# Known: "Your Selection" reads below the per-pax sum of the two tickets (3.8% on the run this was
# written from) while the cart total reconciles exactly. Out of scope here, unexplained.

@ado:82675
@regression @flights @travelfusion @provider:travelfusion @management-fee @carrier-specific-mu
Feature: 82675 Travelfusion - Management markup of 50% applied on the Aer Lingus leg only and carried into the cart
  As a corporate traveler on a Travelfusion configuration with a carrier-specific management markup
  I want the 50% markup on the configured carrier's leg and none on the other leg
  So that the amount holds whether the trip issues one ticket or separated tickets

  @priority:high
  Scenario: LON-JFK by schedule applies 50% MU on the Aer Lingus outbound and none on the Condor inbound, charging the marked-up amount per pax for 3 PAX
    Given I am logged in as "fusion.mu1@corp.ams" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler
    And I have added a random guest traveler

    When I search for a round trip flight by schedule from "LON" to "JFK" with outbound cabin "Economy" and return cabin "Economy"
    And flight results should be available

    # Aer Lingus is the configured carrier
    And I filter results by carrier "EI"
    And I start intercepting the "flightPricing" API response
    And I click to open first pricing options
    Then the management markup on the published fare should be "50" percent of the whole price
    And I select the published fare for every direction from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible

    # Condor is not, so it earns no markup - and the mixed carriers split the trip into two tickets
    When I filter results by carrier "Condor"
    And I start intercepting the "flightPricing" API response
    And I click to open first pricing options
    Then the markup in the flight pricing response should be "0"
    And I select the first option from pricing options
    And I add to trip from pricing options

    And I wait for "Your Selection" text to be visible
    Then the "Separated Tickets" indicator should be visible in the pricing page
    And I add "Your Selection" fare to trip

    # The drawer covers one ticket, the Aer Lingus one, so its subtotal is the marked-up per-pax
    # price charged to all 3 travellers
    When I click to open price breakdown in cart
    And I extract the price from price breakdown
    Then the price breakdown total should equal the published fare price multiplied by the number of selected travelers
    And I close price breakdown modal
    Then I successfully cancel the trip
