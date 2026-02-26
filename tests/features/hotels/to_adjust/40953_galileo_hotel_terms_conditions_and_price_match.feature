# Test Name: 40953 [Merge] Galileo - Hotel - Check "Terms and Conditions" are displayed, price does not change before and after booking
# Description: 
# Status: Active
# Labels: Regression,Galileo,Gray Dawes,Hotel,Full Purchase,Pre Prod,Sanity,Terms and Conditions,merge,price,Check price,Daily Hotels,progress page,Giata,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-01-07T05:36:46Z
# Updated: 2025-11-10T03:12:15Z

@regression @provider:galileo
Feature: 40953 Galileo - Book hotel with terms and conditions and price verification
  As a corporate traveler using Galileo
  I want to check terms and conditions in room level and cart and verify prices match
  So that I can confirm the booking terms and ensure price consistency

  @priority:critical
  Scenario: Terms and conditions are accessible in room level and cart, and price matches after booking
    Given I am logged in as "galileo" "user_one" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London, UK" for 1 night
    And I select the first hotel result
    # TODO: Create step "When I check terms and conditions in room level" that calls DSL checkTermsAndConditions in RoomLevelResults.js
    # TODO: Create step "When I extract the room price from room level results" that calls DSL extractRoomPrice in RoomLevelResults.js
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "When I check terms and conditions in cart" that calls DSL checkTermsAndConditions in Cart.js
    # TODO: Create step "Then the price in cart should match the price from room level results" that calls DSL comparePrices in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I cancel the trip
