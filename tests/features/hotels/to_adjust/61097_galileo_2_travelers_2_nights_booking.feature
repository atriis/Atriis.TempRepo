# Test Name: 61097 Galileo hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Regression,Hotel,Galileo,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,progress page,66444 hotel results,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-04-20T09:24:55Z
# Updated: 2026-02-09T12:47:28Z

@regression @provider:galileo
Feature: 61097 Galileo - Book hotel for 2 travelers, 2 nights with price verification
  As a travel arranger
  I want to book a hotel for 2 travelers for 2 nights on Galileo
  So that both travelers are accommodated with a verified price

  @priority:critical
  Scenario: 2 travelers booked for 2 nights in Galileo hotel with price match verified
    Given I am logged in as "galileo" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler by name {string}" - needs DSL method addSecondTraveler
    When I search for a hotel in "Birmingham" for 2 nights
    # TODO: Create step "When I filter hotel results by name {string}" calls DSL filterHotelByName
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the cart should show 2 nights and 2 rooms badge" calls DSL verify2Nights2RoomsBadge in Cart.js
    # TODO: Create step "When I extract the price from cart" calls DSL extractCartPrice in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the confirmed booking price should match the cart price" calls DSL compareConfirmedPrice
    When I cancel the trip
