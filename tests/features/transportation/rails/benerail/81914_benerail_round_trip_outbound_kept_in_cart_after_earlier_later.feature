# ADO #81914 - [EU Rail][New UI] Round Trip - Only inbound in cart when using earlier/later for the outbound
# ADO Test Case ID: 82168
@ado:82168
@provider:benerail @regression @priority:critical
Feature: 82168 Benerail - Round trip cart keeps both journeys after selecting an outbound alternative via Later navigation

  As a corporate traveler
  I want the cart to keep both my outbound and inbound EU Rail journeys
  So that a round trip booking is not silently reduced to a single leg when I browse alternative outbound departures

  Scenario: Outbound and inbound journeys both remain in the cart after selecting an outbound alternative via Show Later Departures
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip Benerail train from "bebmiToGbspx" with a near departure date
    When I click Show Later Departures on the outbound results
    When I expand More Options for the last outbound result and select an alternative fare
    When I select the first Benerail option for the inbound journey
    And I add the first result to trip
    Then the outbound and inbound Benerail journeys should both be present in the cart
    Then the booking status should be "Pending booking"
