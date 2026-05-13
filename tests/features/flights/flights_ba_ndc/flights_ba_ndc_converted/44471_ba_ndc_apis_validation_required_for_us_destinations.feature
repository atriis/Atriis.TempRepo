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
    # TODO: implement step — 'the passenger info section should be marked as required'
    #   Assert the APIS/passenger info extras section has a "required" indicator (e.g. red badge or asterisk)
    Then the passenger info section should be marked as required
    # TODO: implement step — 'I click to open passenger info to edit APIS'
    #   Click the edit/expand button on the APIS extras section to open the APIS form
    When I click to open passenger info to edit APIS
    # TODO: implement step — 'I try to save the APIS form'
    #   Click Save on the APIS form without filling in any fields to trigger validation
    And I try to save the APIS form
    # TODO: implement step — '{int} mandatory fields should be highlighted in the APIS section'
    #   Assert that exactly N fields are highlighted with a validation error inside the APIS form
    Then 3 mandatory fields should be highlighted in the APIS section
    # TODO: implement step — 'I fill in the passport number {string} in APIS'
    #   Locate the passport number field in the APIS form and fill it with the given value
    When I fill in the passport number "8732186" in APIS
    # TODO: implement step — 'I fill in the applicable country in APIS with {string}'
    #   Select the given country in the applicable country dropdown/autocomplete inside the APIS form
    And I fill in the applicable country in APIS with "afghanistan"
    # TODO: implement step — 'I fill in the passport expiry date in APIS'
    #   Fill in a future passport expiry date in the APIS form date picker
    And I fill in the passport expiry date in APIS
    # TODO: implement step — 'I save the APIS form'
    #   Click the Save button on the APIS form after filling in the required fields
    And I save the APIS form
    # TODO: implement step — 'the APIS section should show a success notification'
    #   Assert a green success banner/icon is shown on the APIS extras section after saving
    Then the APIS section should show a success notification
