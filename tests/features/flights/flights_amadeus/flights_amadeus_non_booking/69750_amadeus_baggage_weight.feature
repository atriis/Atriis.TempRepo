# Test Name: HYBRID for 69750 Amadeus - Flights - Baggage weight is being sent in 'AddMultiElement'
# Description:
# Status: Active
# Labels: Regression,Flights,Full Purchase,baggage,Amadeus Light Ticketing,hybrid,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-03T03:12:54Z
# Updated: 2025-12-10T08:51:21Z

@regression @flights @amadeus @baggage @light-ticketing @hybrid
Feature: 69750 HYBRID Amadeus - Baggage weight sent in AddMultiElement
  As a corporate traveler
  I want baggage weight information to be correctly sent when booking
  So that my baggage preferences are properly recorded

  Scenario: Add baggage and hold Ryanair low-cost flight
    Given I am logged in as "lucasmoreira@amadeuslowcost.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LON" to "DUB"
    And flight results should be available
    And I filter results by carrier "FR"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    And I click to edit the baggage extras section
    And I wait for the save button
    And I click number of baggage
    And I click dropdown option "ABAG"
    And I click the save button
    And the booking status should be "Pending booking"
    Then the baggage green icon should be visible
    And I click to edit the baggage extras section
    Then the baggage option "ABAG" should be saved
    And I click the save button
    And the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I proceed to checkout
    And I wait for booking details in checkout
    And I click "Don't share the contact details with airlines" checkbox in checkout
    And I complete the booking
    Then I successfully cancel the trip
