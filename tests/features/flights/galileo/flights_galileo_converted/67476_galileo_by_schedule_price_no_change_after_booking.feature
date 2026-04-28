# Test Name: 67476 Galileo - Flights - By Schedule - Price does not change after booking
# Status: Active
# Labels: Regression,Galileo,Flights,by schedule,Full Purchase,price,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-23T11:08:05Z
# Updated: 2026-01-19T07:48:41Z

@regression @galileo @flights @by_schedule @pricing @full_purchase
Feature: 67476 Galileo - By schedule price does not change after booking

  As a corporate traveler
  I want the flight price to remain the same after booking
  So that there are no unexpected price changes

  Scenario: By schedule flight price matches before and after booking
    Given I am logged in as "bsgalileoflight" booking a new trip
    And I have added myself as the traveler
    When I search for a flight by schedule from "PAR" to "MEL"
    And I select flight segments by schedule
    And I select the first option from pricing options
    And I handle conflicting quotes if visible
    And I extract the price from first pricing option
    And I proceed to checkout
    And I complete the booking
    Then the cart total price should match the last extracted price
