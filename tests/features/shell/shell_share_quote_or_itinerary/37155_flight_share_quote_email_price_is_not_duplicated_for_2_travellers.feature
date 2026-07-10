# Test Name: 37155 Flight - Share quote email price is not duplicated for 2 travellers
# Description:
# Status: Active
# Labels: Flights,Regression,multi pax,share quote,general,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-17T04:47:18Z
# Updated: 2025-12-16T09:54:59Z

@regression @shell
Feature: 37155 - Flight - Share quote email price is not duplicated for 2 travellers

  As a travel agent booking a flight quote for two travellers
  I want the share quote email preview to show the same total price as the cart
  So that the price is not duplicated (doubled) in the email sent to the travellers

  Scenario: Share a two-traveller flight quote and confirm the email price matches the cart price
    Given I am logged in as "ruimariano@amadeus.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Rui Mendes"
    When I search for a round trip flight from "LON" to "ORD"
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    When I extract the flight quote price from cart
    And I click the share quote button
    Then "Flight Offer # 1 Pending Booking" should be displayed in the share email preview
    And the flight quote price in the share email preview should match the cart price
