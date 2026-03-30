# Test Name: 67979 Amadeus Light Ticketing - Ryanair - Total price in cart is correct after adding first outbound seat and then inbound seat
# Description:
# Status: Active
# Labels: Amadeus,Flights,Ryanair,Regression,price,Cart,Seating,Amadeus Light Ticketing,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-25T08:29:17Z
# Updated: 2025-10-27T01:47:13Z

@regression @flights @amadeus @ryanair @seating @price @light-ticketing
Feature: 67979 Amadeus Ryanair - Seat price calculation outbound and inbound
  As a corporate traveler
  I want the total cart price to update correctly when adding seats
  So that outbound and inbound seat prices are properly reflected

  Scenario: Cart total updates after adding outbound and inbound seats
    Given I am logged in as "lucas" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "STN" to "BUD"
    And I wait for add to trip text to be visible
    And I filter results by carrier "FR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    And I extract the price at index 4 from "cart"
    When I click to edit extras at index 2
    And I click add seats in extras
    And I wait for the seat map to load
    And I select the first available flight seat
    And I click next flight button
    And I wait for the seat map to load
    And I select the first available flight seat
    And I extract seat price in seat map drawer
    And I save and close seat map drawer
    Then the total price in cart is equal to total price in cart before seats + seats price
