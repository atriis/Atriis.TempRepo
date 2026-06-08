# Test Name: HYBRID for 69750 Amadeus - Flights - Baggage weight is being sent in 'AddMultiElement'
# Description:
# Status: Active
# Labels: Regression,Flights,Full Purchase,baggage,Amadeus Light Ticketing,hybrid,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-11-03T03:12:54Z
# Updated: 2025-12-10T08:51:21Z

@regression @flights @amadeus @baggage @light-ticketing @hybrid
Feature: 69750 Amadeus - Baggage weight sent in AddMultiElement
  As a corporate traveler
  I want baggage weight information to be correctly sent when booking
  So that my baggage preferences are properly recorded

  Scenario: Add baggage and hold Ryanair low-cost flight
    Given I am logged in as "lucasmoreira@amadeuslowcost.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "STN" to "RAK"
    And flight results should be available
    And I filter results by carrier "RK"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click add payment method button
    And I select card 1 and save
    And I fill credit card cvv if needed
    When I click to edit extras at index 1
    And I wait for the save button
    And I click number of baggage
    And I click dropdown option "EXCESS BAGGAGE REQUEST"
    And I click the save button
    Then the baggage green icon should be visible
    And I click to edit extras at index 1
    Then the baggage option "EXCESS BAGGAGE REQUEST" should be saved
    And I click the save button
    Then the booking status should be "Pending booking"
    When I fill credit card cvv if needed
    And I proceed to checkout
    And I complete the booking
    Then I successfully cancel the trip
