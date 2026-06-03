# Test Name: 77052 Sabre - Office ID MU - published rates - fixed value - by schedule round trip - multi PAX
# Status: Draft
# Labels: Regression,Flights,Sabre,Regular Markup,2026 plan 2

@regression @flights @sabre @ado:77052 @management-fee
Feature: 77052 Sabre - Office ID MU fixed value applied on by schedule round trip for multi PAX
  As a corporate traveler with an office ID management markup configuration
  I want to search round trip flights by schedule for 2 adult passengers on different routes
  So that the fixed markup amount is correctly applied only for the configured office ID

  Scenario: No markup on LON-LAS with "9NT0GDG" then Office ID MU of £15 per pax on LAS-LON with "MZ#LGDG"
    Given I am logged in as "corp.full.reg.mu4@sabre.com" booking a new trip
    And I have added myself as the traveler
    And I have added a random guest traveler

    # First search: LON-LAS with office ID 9NT0GDG on AA (NDC) — expects no markup
    When I search for a flight by schedule from "LON" to "LAS" with preferred carrier "AA"
    And I start intercepting the "flightPricing" API response
    And I click to open pricing options for the first NDC direct rate result
    Then the markup in the flight pricing response should be "0"
    And the "results.0.avgPricePerPerson" in the intercepted response should equal "results.0.wholePrice" plus "results.0.markup"
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I start intercepting the "flightPricing" API response
    And I click to open pricing options for the first NDC direct rate result
    Then the markup in the flight pricing response should be "0"
    And the "results.0.avgPricePerPerson" in the intercepted response should equal "results.0.wholePrice" plus "results.0.markup"
    And I close pricing options modal

    # Second search: LAS-LON with office ID MZ#LGDG on VS (non-NDC GDS) — expects £15 MU per pax
    When I click edit search
    And I search for a flight by schedule from "LAS" to "LON" with preferred carrier "VS" in the edit flight search
    And I start intercepting the "flightPricing" API response
    And I click to open pricing options for the first non-NDC result
    Then the markup in the flight pricing response should be "15" per pax configured in "GBP"
    And the "results.0.avgPricePerPerson" in the intercepted response should equal "results.0.wholePrice" plus "results.0.markup"
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for the change flight button to be visible
    And I start intercepting the "flightPricing" API response
    And I click to open pricing options for the first non-NDC result
    Then the markup in the flight pricing response should be "15" per pax configured in "GBP"
    And the "results.0.avgPricePerPerson" in the intercepted response should equal "results.0.wholePrice" plus "results.0.markup"
    And I select the first option from pricing options
    And I add to trip from pricing options
    And I wait for "Your Selection" text to be visible
    And the "Separated Tickets" indicator should not be visible in the pricing page
    And I extract the price from "Your Selection" fare
    And I add "Your Selection" fare to trip
    And the cart total price should be the last extracted price multiplied by the number of selected travelers
    And I open flight details in cart
    Then the flight details drawer total price should match the cart total
    And I close more details in cart
    When I click to open price breakdown in cart
    Then the flight price breakdown should match the totals for the selected travelers
    And I close price breakdown modal
    Then I successfully cancel the trip
