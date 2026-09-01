# Test Name: 33937 Line with product details is displayed after checkout
# Description:
# Status: Active
# Labels: Regression,Hotel,UI,No Amadeus Hotel Book,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-07-06T11:05:24Z
# Updated: 2025-07-11T11:20:36Z

@regression @shell @hotels
Feature: 33937 - Line with product details is displayed after checkout
  As a corporate traveler booking a hotel
  I want the product details line to be displayed on the trip overview after checkout
  So that I can confirm my booked hotel stay details after completing the booking

  Scenario: Hotel product details line is displayed on the trip overview after checkout
    Given I am logged in as "brunasantosnl@testim.com" booking a new trip
    And I have added a random guest traveler
    When I search for a hotel in "London" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    And I proceed to checkout
    And I wait for booking details in checkout
    When I click book and finalize button
    And go to trip text is visible
    Then line with product details is displayed after checkout with status "Confirmed"
    And I click go to trip button
    And the booking status should be "Confirmed"
    Then I successfully cancel the trip
