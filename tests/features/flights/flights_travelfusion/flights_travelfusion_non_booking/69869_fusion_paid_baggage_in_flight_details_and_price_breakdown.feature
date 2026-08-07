# Test Name: 69869 Fusion - Cart - Paid baggage are correctly displayed in Flight Details and Price Breakdown
# Status: Active
# Labels: Regression,Fusion,Flights,baggage,price breakdown,Flight Details,Cart,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-06T01:16:18Z
# Updated: 2025-11-12T03:07:12Z

@regression @flights @fusion @baggage @price-breakdown @priority:high
Feature: 69869 Fusion - Paid baggage correctly displayed in Flight Details and Price Breakdown
  As a corporate traveler adding paid baggage to a Fusion flight
  I want the paid baggage to be displayed correctly in Flight Details and Price Breakdown
  So that the cart reflects the baggage cost in all displays

  Scenario: Paid baggage is displayed in Flight Details and Price Breakdown on Fusion flight
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "KWI" to "DEL"
    Then flight results should be available
    When I filter results by carrier "Indigo"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to edit the baggage extras section
    And I select a paid baggage option
    And I extract the baggage price
    And I extract the selected baggage option label
    And I click the save button
    Then the baggage green icon should be visible
    When I open flight details in cart
    Then the paid baggage should be displayed in flight details
    When I close flight details window
    And I click to open price breakdown in cart
    Then the paid baggage should be displayed in the price breakdown
