# Test Name: 35589 Cart - Icons are displayed
# Description:
# Status: Active
# Labels: Regression,UI,Flights,Hotel,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-05T02:25:54Z
# Updated: 2024-04-16T02:50:55Z

@regression @shell @flights @hotels @ui
Feature: 35589 - Cart icons are displayed
  As a corporate traveler
  I want the product icons to be visible in the cart and trip overview after adding a flight and a hotel
  So that I can quickly identify each booked product at a glance

  Scenario: Flight and hotel icons are displayed in the cart after adding both products
    Given I am logged in as "ruimendes@amadeus.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "LON"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    When I click to add a hotel to my trip from cart
    When I search for a hotel in "London, UK" for 1 night from the cart drawer
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the flight icon should be visible in the trip overview
    And the hotel icon should be visible in the quote summary
