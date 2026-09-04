# Test Name: 78541 Galileo - UAPIGALILEO Markup alignment - published rates - management markup on Lufthansa only - complete trip round trip - multi PAX
# Status: Draft
# Labels: Regression,Flights,Galileo,Regular Markup,2026 plan 2

# ADO Test Case ID: 78541
# US 77638: management markup = 50% of base fare on Lufthansa published fares only, per pax.
@regression @flights @galileo @ado:77638 @management-fee
Feature: 78541 Galileo - Management markup applied only to Lufthansa on a complete-trip round trip for multi PAX
  As a corporate traveler with a Galileo (UAPI) management markup configuration
  I want to price and book a complete-trip round trip FRA<->JFK for 2 adult passengers
  So that the management markup is applied per pax only to Lufthansa flights and is reflected in the cart total

  @priority:high
  Scenario: Management markup 50% of base on Lufthansa, none on Scandinavian, reflected in cart for 2 PAX
    Given I am logged in as "corp.mu1@galileo.gdg" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    When I search for a round trip flight from "FRA" to "JFK"
    And flight results should be available

    # Scandinavian does not qualify -> no markup
    And I filter results by carrier "Scandinavian"
    And I start intercepting the "flightPricing" API response
    And I click to open first pricing options
    Then the markup in the flight pricing response should be "0"
    And I close pricing options modal

    # LH qualifies -> non-stop so both priced segments are LH, then markup = 50% of base
    When I filter results by carrier "Lufthansa"
    And I filter results to non-stop flights only
    And I start intercepting the "flightPricing" API response
    And I click to open first pricing options
    Then the management markup on the published fare should be "50" percent of the base fare

    And I select the published fare from pricing options
    And I select the published fare from pricing options
    And I add to trip from pricing options
    Then the booking status should be "Pending booking"

    # Cart total includes the markup, per pax, for the 2 travellers
    And the cart total price should equal the published fare price multiplied by the number of selected travelers
    Then I successfully cancel the trip
