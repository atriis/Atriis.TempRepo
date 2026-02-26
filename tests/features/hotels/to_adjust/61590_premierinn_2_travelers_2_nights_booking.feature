# Test Name: 61590 premier inn - book for 2 travelers and 2 nights
# Description: 
# Status: Active
# Labels: Hotel,Full Purchase,more than 1 night,No Amadeus Hotel Book,multi pax,Daily Hotels,Premier Inn Regression,progress page,66444 hotel results,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-04T12:16:55Z
# Updated: 2026-02-09T12:55:18Z

@regression @provider:premierinn
Feature: 61590 Premier Inn - Book hotel for 2 travelers 2 nights
  As a travel arranger
  I want to book a Premier Inn hotel for 2 travelers for 2 nights
  So that both travelers are accommodated with Premier Inn's booking system

  @priority:critical
  Scenario: 2 travelers booked in Premier Inn hotel for 2 nights
    Given I am logged in as "premierinn" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add a second traveler by name {string}" - needs DSL method addSecondTraveler
    When I search for a hotel in "London" for 2 nights
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the cart should show 2 nights and 2 rooms badge" calls DSL verify2Nights2RoomsBadge in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I cancel the trip
