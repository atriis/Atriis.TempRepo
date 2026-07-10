# Test Name: 80770 Sabre - Origin-Destination MU - published rates - separated tickets - round trip - multi PAX
# Status: Draft
# Labels: Regression,Flights,Sabre,Regular Markup,2026 plan 2

# ADO Test Case ID: 80770
@regression @flights @sabre @ado:77052 @management-fee @separate-tickets
Feature: 80770 Sabre - Origin-Destination MU applied per segment on a separated-tickets round trip for multi PAX
  As a corporate traveler with an origin-destination management markup configuration
  I want to book a separated-tickets round trip where only the Portugal->France leg qualifies
  So that the 25% origin-destination markup is applied per pax on the LIS->PAR ticket only, and not on the PAR->LIS return

  @priority:high
  Scenario: Origin-Destination MU (PT->FR) = 25% of base on the LIS->PAR ticket, 0 on the PAR->LIS ticket, separated tickets, 2 PAX
    Given I am logged in as "corp.full.reg.mu7@sabre.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    # Different cabins per leg (Economy out / Business return) + different carriers is what makes the two
    # tickets combine into one SEPARATED-tickets selection across different metro airports (ORY out, CDG back).
    When I search for a round trip flight by schedule from "LIS" to "PAR" with outbound cabin "Economy" and return cabin "Business"
    And flight results should be available

    # Outbound LIS->ORY (PT->FR, qualifies for the 25% MU) on TAP: use the direct NDC fare (it combines into
    # the separated selection), verify the 25%, then select it.
    And I filter results by carrier "TAP Air Portugal"
    And I start intercepting the "flightPricing" API response
    And I click to open pricing options for the first NDC direct rate result
    Then the origin-destination markup should be "25" percent of the base fare on the published fare
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible

    # Return CDG->LIS (FR->PT, no MU) on Scandinavian: a different carrier/cabin makes the tickets separate.
    And I filter results by carrier "Scandinavian"
    And I start intercepting the "flightPricing" API response
    And I click to open pricing options for the first NDC direct rate result
    Then the markup in the flight pricing response should be "0"
    And I select the first option from pricing options
    And I add to trip from pricing options

    And I wait for "Your Selection" text to be visible
    Then the "Separated Tickets" indicator should be visible in the pricing page
    And I extract the price from "Your Selection" fare
    And I add "Your Selection" fare to trip
    Then the booking status should be "Pending booking"
    And the cart total price should be the last extracted price multiplied by the number of selected travelers within 0.5 percent
    Then I successfully cancel the trip
