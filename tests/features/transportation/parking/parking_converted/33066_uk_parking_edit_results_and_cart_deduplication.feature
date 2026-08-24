# Test Name: 33066 [Merge] UK Parking - Edit from results page and cart and adding to cart is not duplicated and it is possible to delete it
# Description:
# Status: Active
# Labels: price offer,UK Parking,Regression,No Amadeus Hotel Book,merge,Cart,Keeps failing,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-01-04T10:11:37Z
# Updated: 2025-10-02T09:36:43Z

@regression @transportation @parking @cart
Feature: 33066 UK Parking - Edit search, cart deduplication and deletion

  As a corporate traveler
  I want to edit my parking search from the results page and manage my cart
  So that parking is not duplicated in the cart and I can delete it

  Scenario: Edit parking search from results, verify one item in cart, view more details, navigate back from checkout
    Given I am logged in as "rafaelrocha@parkinguk.com" booking a new trip
    And I have added myself as the traveler
    When I search for UK parking at "LHR"
    And I wait for add to trip text to be visible
    And I filter results by "Park and Ride" checkbox
    And I filter results by "Terminal 3" checkbox
    And I edit the UK parking search by changing the dates from the results page
    And I add the first result to trip
    And the booking status should be "Pending booking"
    Then the cart should contain 1 quote
    When I click more details in cart
    Then the more details should show "Why book"
    When I close more details in cart
    And I fill in UK parking trip details with mobile "123121312", car make "Tesla", model "Ts", registration "87878", colour "78236783", outbound flight "8789", terminal "3", return flight "324" and return terminal "1"
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I wait for booking details in checkout
    And I navigate to cart from checkout
    Then I successfully cancel the trip
