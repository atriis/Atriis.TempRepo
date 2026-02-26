# Test Name: 73521 amadeus value hotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Hotel,Full Purchase,more than 1 night,multi pax,Amadeus Value hotel,Regression
# Owner: Shani Hadar
# Created: 2025-05-04T01:13:40Z
# Updated: 2026-02-09T12:35:42Z

@regression @provider:amadeus_value_hotel
Feature: 73521 Amadeus Value Hotel - Book 2 travelers 2 nights with price match
  As a travel arranger using Amadeus Value Hotels
  I want to book a hotel for 2 travelers for 2 nights
  So that both travelers are accommodated and price is verified end-to-end

  @priority:critical
  Scenario: 2 travelers booked for 2 nights in Amadeus Value Hotel with price match
    Given I am logged in as "amadeus_value_hotel" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler by name {string}" - needs DSL method addSecondTraveler
    When I search for a hotel in "LON" for 2 nights
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
