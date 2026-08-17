@daily_flights @flights @provider:amadeus_light_ticketing
Feature: 61133 Amadeus Light Ticketing - Ryanair - Total price in cart is correct after adding seat
  As a corporate traveler using Amadeus Light Ticketing
  I want to add a Ryanair flight and a seat to my trip
  So that the total price in cart reflects the correct sum of the flight and seat prices

  @priority:critical
  Scenario: Total cart price is the sum of flight price and seat price after adding a seat
    Given I am logged in as "lucasmoreira@amadeuslowcost.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "BUD"
    And flight results should be available
    When I filter airline results by "Ryanair" checkbox
    And I add the first flight to cart
    And I extract the price at index 4 from "cart"
    And I click seating in extras
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I extract seat price in seat map drawer
    And I save and close seat map drawer
    Then the total price in cart is equal to total price in cart before seats + seats price
