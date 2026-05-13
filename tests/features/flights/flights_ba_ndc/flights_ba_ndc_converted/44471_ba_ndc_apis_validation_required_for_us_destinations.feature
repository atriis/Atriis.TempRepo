# Test Name: 44471 BA NDC - APIS Validation - Required for US destinations and mandatory fields highlight when empty
# Description:
# Status: Active
# Labels: BA NDC Regression,APIS,Flights,Cart,mandatory,mandatory fields,passenger info,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-04-08T10:00:13Z
# Updated: 2025-11-04T04:52:33Z

@regression @flights @ndc @ba @apis
Feature: 44471 BA NDC - APIS validation required for US destinations

  As a corporate traveler
  I want to book a BA NDC flight to a US destination
  So that I can verify APIS passenger info is required and mandatory fields are highlighted when empty

  Scenario: APIS is required for US destination and mandatory fields are highlighted
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "LON" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    Then the passenger info section should be marked as required
    When I click to open passenger info to edit APIS
    And I try to save the APIS form
    Then 3 mandatory fields should be highlighted in the APIS section
    When I fill in the passport number "8732186" in APIS
    And I fill in the applicable country in APIS with "afghanistan"
    And I fill in the passport expiry date in APIS
    And I save the APIS form
    Then the APIS section should show a success notification
