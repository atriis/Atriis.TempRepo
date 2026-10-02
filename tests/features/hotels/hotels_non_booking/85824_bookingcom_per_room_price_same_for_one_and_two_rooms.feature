# Test Name: 85824 Booking.com - Hotel list per-room price is the same for 1 and 2 rooms
# Status: Active
# Labels: Hotel,Booking.com,multi room,price,hotel results
# Owner: Yael Alef
# Created: 2026-10-01

# ADO Test Case ID: 85824
# ADO workitem ID: 85736 (Bug)
#
# Bug: for an N-room search Booking.com accommodations/search can allocate ONE multi-adult room for
# the whole booking (products[].number_of_adults = 2). BookingComHotelSearchEngine still divides
# that total by N (MinRate /= numberOfRoom), so the hotel list quotes half of one room's price as
# the per-room price. Dev 2026-10-01: The Guards Hotel 187 at 1 room, 94 at 2 rooms
# (trips 3906085 / 3906086). Expected to FAIL until 85736 is fixed.
#
# Only the hotel list is checked: on dev, test Booking.com offices send every room search to the
# Booking.com test property 10507360, so the room page cannot show a real hotel.
# 2 rooms = two travellers (1 guest per room); rebecca@kom.com allows multi-room searches.

@ado:85824 @regression @provider:bookingcom
Feature: 85824 Booking.com - Hotel list per-room price does not change with the number of rooms
  As a corporate traveller searching Booking.com hotels for several rooms
  I want the hotel list to show the real per-room price
  So that a multi-room search does not quote half of one room's price

  @priority:high
  Scenario: Booking.com per-room price for 2 rooms equals the per-room price for 1 room
    Given I am logged in as "rebecca@kom.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "Edinburgh" for 1 night
    And I wait to see view rates text in results page
    And I filter hotel results by hotel name "The Guards Hotel"
    And I extract the price from hotel level results
    Given I am logged in as "rebecca@kom.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Rita Hok"
    When I search for a hotel in "Edinburgh" for 1 night
    And I wait to see view rates text in results page
    And I filter hotel results by hotel name "The Guards Hotel"
    And I extract the price from hotel level results
    Then the extracted price at index 1 should equal the extracted price at index 0 within tolerance of 1.0
