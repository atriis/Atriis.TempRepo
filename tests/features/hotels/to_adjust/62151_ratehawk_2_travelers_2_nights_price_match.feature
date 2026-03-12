# Test Name: 62151 Ratehawk hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Hotel,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,Ratehawk Regression,progress page,66444 hotel results,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-18T10:28:29Z
# Updated: 2026-02-09T12:56:47Z

@regression @provider:ratehawk
Feature: 62151 Ratehawk - Book hotel for 2 travelers 2 nights with price match
  As a travel arranger
  I want to book a Ratehawk hotel for 2 travelers for 2 nights
  So that both travelers are accommodated and the price is consistent from cart to confirmation

  @priority:critical
  Scenario: 2 travelers booked for 2 nights via Ratehawk with price match and cancel
    Given I am logged in as "lidi" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler by name {string}" - needs DSL method addSecondTraveler
    When I search for a hotel in "LON" for 2 nights
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the cart should show 2 nights and 2 rooms badge" calls DSL verify2Nights2RoomsBadge in Cart.js
    # TODO: Create step "When I extract the price from cart" calls DSL extractCartPrice in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the confirmed booking price should match the cart price" calls DSL compareConfirmedPrice
    Then I successfully cancel the trip

