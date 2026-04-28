# Test Name: 35710 New UI - We are displaying the existing FQTV when it is configured
# Status: Active
# Labels: No Amadeus Hotel Book,FQTV,Flights,Lufthansa NDC Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-11T03:06:12Z
# Updated: 2025-09-14T08:43:30Z

@regression @flights @fqtv @ndc @lufthansa
Feature: 35710 Flights - Existing FQTV is displayed when configured
  As a corporate traveler with a configured FQTV
  I want to see my existing frequent flyer number in the cart
  So that I know it will be applied to my booking

  Scenario: Existing FQTV is displayed in cart when configured
    Given I am logged in as "marinasimoes" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "MUC" to "LHR"
    And I filter results by carrier "LH"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click frequent flyer in extras
    Then the FQTV should show "LH - 12321"
