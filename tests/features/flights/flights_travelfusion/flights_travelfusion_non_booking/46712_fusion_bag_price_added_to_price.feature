# Test Name: 46712 Fusion - Bag price is being added to the price
# Status: Active
# Labels: Regression,Flights,baggage,Fusion,price,FailedFusion,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-05-31T08:14:53Z
# Updated: 2025-07-16T05:09:59Z

@regression @flights @fusion @baggage @price @priority:high
Feature: 46712 Fusion EasyJet - Bag price is correctly added to the total price
  As a corporate traveler adding baggage to a Fusion EasyJet booking
  I want the bag price to be added to the total price in price breakdown and cart
  So that the cart total reflects the baggage cost

  Scenario: Bag price added correctly to Fusion EasyJet round trip booking
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "MAD"
    And flight results should be available
    And I filter airline results by "EasyJet" checkbox
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I save the current flight cart total for checkout comparison
    And I click to open price breakdown in cart
    And I extract the price from price breakdown
    Then the price breakdown price should equal the cart price
    When I close price breakdown modal
    And I save the current flight cart total for checkout comparison
    And I click to edit the baggage extras section
    And I select a paid baggage option
    And I extract the baggage price
    And I click the save button
    Then the baggage green icon should be visible
    And the price in cart should equal the total price before adding baggage + the baggage price
  