# Test Name: 68498 BA NDC - APIS - Destination Address US Flights is no longer mandatory
# Description:
# Status: Active
# Labels: BA NDC Regression,APIS,Flights,Search Flight,Cart,NDC,Destination Address,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-10-07T09:35:25Z
# Updated: 2025-10-22T02:29:12Z

@regression @flights @ndc @ba @apis
Feature: 68498 BA NDC - APIS destination address for US flights is no longer mandatory

  As a corporate traveler
  I want to book a BA NDC flight to the US and open the APIS section
  So that I can verify destination address is no longer a mandatory field

  Scenario: APIS section opens for US flight and all fields are editable without destination address being mandatory
    Given I am logged in as "iancurtis@ndcba.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "NYC"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to open passenger info to edit APIS
    Then the APIS form should show 11 editable fields
    When I save the APIS form
    Then the APIS section should show a success notification
