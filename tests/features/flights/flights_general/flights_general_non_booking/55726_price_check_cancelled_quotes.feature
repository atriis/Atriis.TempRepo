# Test Name: 55726 Price check for cancelled flights quotes.
# Status: Active
# Labels: Regression,Flights,Check price,2026 plan 1
# Owner: pini harush
# Created: 2024-12-26T12:35:48Z
# Updated: 2026-02-22T06:46:15Z

@regression @flights @general @check-price
Feature: 55726 Flights - Price check for cancelled flights quotes
  As a corporate traveler
  I want to check the price of a cancelled flight quote
  So that I can rebook at the current price

  Scenario: Price check on cancelled flight quote returns pending booking
    Given I am logged in as "caroldynamics@club.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "GRU"
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    Then I successfully cancel the quote
    When I show cancelled items
    And I click check price button in cart
    Then the fare rules should be displayed in the price check modal
    And I click proceed on the price check dialog
    Then the booking status should be "Pending booking"