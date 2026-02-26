# Test Name: 69671 Sabre - can book 4 travelers in 2 rooms
# Description: 
# Status: Active
# Labels: Sabre,Hotel,Regression,Full Purchase,multi pax,Giata,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-11-02T05:24:13Z
# Updated: 2026-02-16T12:43:38Z

@regression @provider:sabre
Feature: 69671 Sabre - Book hotel for 4 travelers in 2 rooms with price match
  As a travel arranger
  I want to book a Sabre hotel for 4 travelers in 2 rooms
  So that all travelers are accommodated and the booking is confirmed

  @priority:critical
  Scenario: 4 travelers booked in 2 Sabre hotel rooms with confirmed status
    Given I am logged in as "sabre" "user_one" booking a new trip
    And I have added myself as the traveler
    # TODO: Create step "When I add {int} additional travelers by name" for 3 more travelers
    # TODO: Create step "When I search for a hotel in {string} for {int} nights and {int} rooms" that calls DSL searchHotelMultiRoom in HotelSearch.js
    When I search for a hotel in "Leipzig" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the cart should show 2 rooms badge" calls DSL verify2RoomsBadge in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I cancel the trip
