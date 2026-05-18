# Test Name: 55148 Travelfusion - Vueling - Hand luggage options are displayed
# Status: Active
# Labels: Fusion,Flights,Regression,baggage,hand luggage,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-07T01:54:01Z
# Updated: 2026-01-06T09:51:19Z

@regression @flights @fusion @baggage @hand-luggage @vueling @priority:medium
Feature: 55148 Fusion Vueling - Hand luggage options are displayed
  As a corporate traveler booking a Vueling flight via Fusion
  I want to see hand luggage options in the cart
  So that I can select an appropriate hand luggage option

  Scenario: Hand luggage options are displayed and can be selected on Vueling Fusion flight
    Given I am logged in as "mikeshinoda@travelfusion.com" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "BCN" to "BRU"
    Then flight results should be available
    When I filter results by carrier "VY"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: implement 'I select a hand luggage option' — see Select_hand_luggage_option() in Testim source (test 55148)
