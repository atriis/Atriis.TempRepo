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
    Given I am logged in as "lidi@ratehawk.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "123 Champs-elysees" for 1 night
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I extract the price from room level results
    And I add a refundable room to my cart
    When I extract the hotel quote price from cart
    Then the price in cart should match the room level price
    When I click more details in cart
    And I extract the price from more details
    Then the price in more details should match the price in cart
    When I close more details in cart
    And I fill in the OOP justification text "BBBBB"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    Then I successfully cancel the trip

