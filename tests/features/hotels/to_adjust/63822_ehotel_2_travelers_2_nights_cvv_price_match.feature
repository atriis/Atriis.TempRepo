# Test Name: 63822 Ehotel - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Hotel,Full Purchase,more than 1 night,multi pax,No Amadeus Hotel Book,Ehotel Regression,progress page,66444 hotel results,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T09:51:23Z
# Updated: 2026-02-09T12:57:26Z

@regression @provider:ehotel
Feature: 63822 eHotel - Book hotel for 2 travelers 2 nights with CVV and price match
  As a travel arranger
  I want to book an eHotel for 2 travelers for 2 nights with CVV verification
  So that both travelers are accommodated and price is verified from cart to confirmation

  @priority:critical
  Scenario: 2 travelers booked for 2 nights in eHotel with CVV and price match verified
    Given I am logged in as "ehotel" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler by name {string}" - needs DSL method addSecondTraveler
    When I search for a hotel in "Amsterdam" for 2 nights
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the cart should show 2 nights and 2 rooms badge" calls DSL verify2Nights2RoomsBadge in Cart.js
    # TODO: Create step "When I set the CVV for the selected payment card" that calls DSL setCVVForCard in CartFop.js
    # TODO: Create step "When I extract the price from cart" calls DSL extractCartPrice in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the confirmed booking price should match the cart price" calls DSL compareConfirmedPrice
    Then I successfully cancel the trip

