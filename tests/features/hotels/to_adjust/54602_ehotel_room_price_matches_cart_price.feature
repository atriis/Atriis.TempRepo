# Test Name: 54602 [Merge] eHotel - Price is the same in room level and cart and adding corporate card works
# Description: 
# Status: Active
# Labels: Ehotel Regression,Hotel,Cart,FOP,credit card,merge,price,Check price,Daily Hotels,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-24T09:38:45Z
# Updated: 2025-03-31T05:55:48Z

@regression @provider:ehotel
Feature: 54602 eHotel - Price from room level matches price after adding to cart
  As a corporate traveler using eHotel
  I want to verify that the room price shown in results matches the price in the cart
  So that I'm not surprised by price changes when proceeding to book

  @priority:high
  Scenario: Room price consistent between room level results and cart, add CC from profile
    Given I am logged in as "ehotel" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I sort room results by price" that calls DSL sortRoomsByPrice in RoomLevelResults.js
    # TODO: Create step "When I extract the room price from room level results" that calls DSL extractRoomPrice in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the price in cart should match the price from room level results" that calls DSL comparePrices in Cart.js
    When I add a credit card as payment method
    Then I successfully cancel the trip

