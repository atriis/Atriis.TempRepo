# Test Name: Hybrid for 54900 BA NDC -TSA / Redress sent correctly in booking request
# Description: Merged with 54900
# Status: Active
# Labels: BA NDC Regression,APIS,Search Flight,Flights,Cart,2026 plan 2
# Owner: Noam Miller
# Created: 2024-11-26T11:15:01Z
# Updated: 2025-11-25T08:31:39Z

@regression @flights @ndc @ba @apis @tsa-redress
Feature: hybrid_54900 BA NDC - TSA redress sent correctly in booking request

  As a corporate traveler with TSA/redress data configured
  I want to book a BA NDC flight to the US
  So that I can verify TSA/redress information is correctly sent in the booking request

  Scenario: TSA redress is sent correctly when booking a BA NDC US flight
    Given I am logged in as "tsa@testim.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LHR" to "PHL"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I hold the trip
    Then I successfully cancel the trip
