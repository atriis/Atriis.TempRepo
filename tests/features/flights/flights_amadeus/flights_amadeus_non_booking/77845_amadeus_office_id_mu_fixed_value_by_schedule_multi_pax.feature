# Test Name: 77845 Amadeus - Office ID MU - published rates - fixed value - by schedule round trip - multi PAX
# Status: Draft
# Labels: Regression,Flights,Amadeus,Regular Markup,2026 plan 2
# Source: ADO User Story #76040 - Amadeus - Markup alignment

# ADO Test Case ID: 77845
@ado:77845
@regression @flights @amadeus @management-fee
Feature: 77845 Amadeus - Office ID MU fixed value applied on by schedule round trip for multi PAX
  As a corporate traveler with an office ID management markup configuration
  I want to search round trip flights by schedule for 2 adult passengers on different routes
  So that the fixed markup amount is correctly applied only for the configured office ID

  Scenario: No markup on LON-FRA (FLXtest) then Office ID MU of $15 per pax on LIS-LON (NCEPF) for TAP Portugal
    Given I am logged in as "full.reg.mu5.corp@amadeus.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    # First search: LON-FRA route with office ID FLXtest (LH NDC) — expects no markup. The NDC row is
    # picked explicitly: LH is also sold through Amadeus office NCEPF, which carries the $15 MU.
    When I search for a flight by schedule from "LON" to "FRA" with preferred carrier "LH"
    And I click to open pricing options for the first NDC direct rate result
    And I start intercepting the flight pricing response
    Then the markup in the flight pricing response should be "0"
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I click to open pricing options for the first NDC direct rate result
    And I start intercepting the flight pricing response
    Then the markup in the flight pricing response should be "0"
    And I close pricing options modal

    # Second search: LIS-LON route with office ID NCEPF on TAP Portugal (TP) — expects $15 MU per pax
    When I click edit search
    And I search for a flight by schedule from "LIS" to "LON" with preferred carrier "Tap Air Portugal" in the edit flight search
    And I click to open first pricing options
    And I start intercepting the flight pricing response
    Then the markup in the flight pricing response for carrier "TP" should be "15" per pax configured in "USD"
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I click to open first pricing options
    And I start intercepting the flight pricing response
    Then the markup in the flight pricing response for carrier "TP" should be "15" per pax configured in "USD"
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And the "Separated Tickets" indicator should not be visible in the pricing page
    And I extract the price from "Your Selection" fare
    And I add "Your Selection" fare to trip
    Then the cart total price should be the last extracted price multiplied by the number of selected travelers
    And I open flight details in cart
    Then the flight details drawer total price should match the cart total
    And I close more details in cart
    When I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for the selected travelers
    And I close price breakdown modal
    Then I successfully cancel the trip
