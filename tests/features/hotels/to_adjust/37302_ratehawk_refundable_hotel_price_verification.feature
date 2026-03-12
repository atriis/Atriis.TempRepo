# Test Name: 37302 [Merge] RateHawk - Total pricing with additional fees is correct, price does not change after adding to cart and booking is successful
# Description: 
# Status: Active
# Labels: CR7,No Amadeus Hotel Book,Hotel,additional fees,merge,Ratehawk Regression,Pre Prod,price,Full Purchase,progress page,Giata,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-10-24T02:20:58Z
# Updated: 2025-11-24T12:24:56Z

@regression @provider:ratehawk
Feature: 37302 Ratehawk - Book refundable hotel with price verification
  As a corporate traveler using Ratehawk
  I want to filter for refundable hotels, check terms, and verify the price matches after adding to cart
  So that I can make informed booking decisions and ensure price accuracy

  @priority:critical
  Scenario: Refundable hotel price matches between room level and cart
    Given I am logged in as "lidi" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "123 Champs-Élysées" for 1 night
    # TODO: Create step "When I filter hotel results by refundable" that calls DSL method filterByRefundable in HotelSearch.js
    # TODO: Create step "When I check the terms and conditions in room level" that calls DSL method checkTermsAndConditions in RoomLevelResults.js
    # TODO: Create step "When I extract the room price from room level results" that calls DSL method extractRoomPrice in RoomLevelResults.js
    And I add a refundable room to my cart
    Then the hotel should appear as refundable in my cart
    # TODO: Create step "Then the price in cart should match the price from room level results" that calls DSL method comparePrices in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip

