# Test Name: 57320 Amadeus - Ryanair - Price is correct after adding baggage
# Description:
# Status: Active
# Labels: Amadeus,Flights,Ryanair,Regression,baggage,price,Cart,GDS,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-14T06:56:52Z
# Updated: 2026-02-16T10:28:35Z

@regression @flights @amadeus @ryanair @baggage @price
Feature: 57320 Amadeus - Ryanair - Price correct after adding baggage
  As a corporate traveler
  I want the total price to be correct after adding baggage to a Ryanair flight
  So that I am not overcharged for baggage

  Scenario: Cart price updates correctly after adding baggage to Ryanair flight
    Given I am logged in as "ryanAir@amadeus.ams" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BUD" to "DUB" on the 2 "thursday" of next month
    And flight results should be available
    And I filter results by carrier "Ryanair"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I extract the total cart summary price
    And I click to edit the baggage extras section
    And I wait for the save button
    And I click number of baggage
    And I click dropdown option "BAG"
    And I extract the baggage price
    And I click the save button
    Then the baggage green icon should be visible
    When I extract the total cart summary price
    Then the cart summary price should equal the cart summary price before adding baggage plus the baggage price
