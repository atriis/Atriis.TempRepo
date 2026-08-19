# Test Name: 62013 Evolvi - Inbound codes are correct in cart
# Description:
# Status: Active
# Labels: Regression,Rail,Evolvi,Transportation,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-05-09T12:42:19Z
# Updated: 2025-12-09T05:06:11Z
@transportation @rails @evolvi @regression
Feature: 62013 Evolvi - Inbound codes are correct in cart
  As a corporate traveler
  I want to book a round trip Evolvi journey and review it in the cart
  So that the outbound and inbound station codes are shown in the correct order

  Scenario: Round trip Evolvi journey shows the correct outbound and inbound station codes in cart
    Given I am logged in as "thiagosantos@evolvi.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Evolvi train from "licToEus"
    And I acknowledge the push notification
    And I add an Evolvi round trip to the trip
    And the booking status should be "Pending booking"
    Then the cart should show "Lichfield City (LIC)" to "London Euston (EUS)" for the Evolvi outbound leg
    And the cart should show "London Euston (EUS)" to "Lichfield City (LIC)" for the Evolvi inbound leg
