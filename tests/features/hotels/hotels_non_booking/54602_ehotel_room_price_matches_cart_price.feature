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
    Given I am logged in as "lucianagristo@ehotelclub.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "London" for 1 night
    And I wait to see view rates text in results page
    When I sort hotel results by "Price"
    And I extract the price from hotel level results
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I extract the price from room level results
    And I add the first available room to my cart
    Then the hotel level price should match the room level price
    Then the booking status should be "Pending booking"
    When I extract the hotel quote price from cart
    Then the price in cart should match the room level price
    When I click add payment method button
    When I click the card "testim ehotel" checkbox
    When I save the card selection
    Then the payment type should be "Paid by Traveller"
    
