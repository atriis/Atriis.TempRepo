# Test Name: 64405 booking.com - credit card without card holder name and country
# Description: 
# Status: Active
# Labels: Booking.com,FOP,Regression,No Amadeus Hotel Book,Hotel,Cart,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-07-14T09:37:17Z
# Updated: 2026-02-03T05:06:56Z

@regression @provider:bookingcom
Feature: 64405 Booking.com - Credit card validation without cardholder name and country
  As a corporate traveler
  I want to add a credit card but see validation errors when cardholder name and country are missing
  So that incomplete card details cannot be submitted

  @priority:medium
  Scenario: Credit card cannot be saved without cardholder name and country
    Given I am logged in as "rebeccacardin" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    And the default card should have a complete missing info button
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    When I click complete missing info for the holder name card
    Then the card form should show missing details for card holder name   
    When I save the card form with empty required fields
    When I fill in the card holder name as "lior verv"
    And I save the missing card details
    And I fill credit card cvv if needed
    When I click to edit the card
    And I select the no country card
    Then the card form should show missing details for country
    When I save the card form with empty required fields
    And I select the first available country
    And I save the missing card details
    Then the no country card should be displayed in cart 
    Then the payment type should be "Paid by Corporate"
    And I fill credit card cvv if needed
    And I click the proceed to checkout button
    When I navigate to cart from checkout
    Then the booking status should be "Pending booking"
    Then I successfully cancel the trip