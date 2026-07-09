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
    And I handle conflicting quotes if visible
    Then the cart status should be Pending booking
    # TODO: extract the flight quote total price from the cart and store it for later comparison (no catalog phrase; only a hotel equivalent exists: "I extract the hotel quote price from cart")
    When I extract the flight quote price from cart
    And I click the share quote button
    Then "Flight Offer # 1 Pending Booking" should be displayed in the share email preview
    # TODO: assert the flight price shown in the share email preview equals the stored cart price (Testim compared priceCart vs priceShareQuote within a 0.09 tolerance to prove the price is not duplicated for 2 travellers); no catalog phrase compares the share-email price to the cart price
    And the flight quote price in the share email preview should match the cart price
    Then I successfully cancel the trip
