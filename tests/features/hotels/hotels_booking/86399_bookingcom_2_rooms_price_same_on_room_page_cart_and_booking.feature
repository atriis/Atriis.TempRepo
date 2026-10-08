# Test Name: 86399 Booking.com - 2 rooms price is the same on the room page, in the cart and after booking
# Status: Active
# Labels: Hotel,Booking.com,multi room,multi pax,price,Full Purchase
# Owner: Yael Alef
# Created: 2026-10-08

# ADO Test Case ID: 86399
# ADO workitem ID: 85736 (Bug)
#
# Bug: Booking.com was sent only the total adults and rooms, so for a 2-room search it could price one
# room for both travellers, and the room page then doubled that price. PR 27097 sends one guest
# allocation entry per room to accommodations/search and accommodations/availability.
# This test books 2 travellers in 2 rooms (1 guest per room) and checks the availability request
# carries the per-room allocation and that the price holds from the room page to the cart and after
# booking. Dev 2026-10-08: 118.58 (59.29 x 2) on the room page, in the cart and booked (trip 3925061).
#
# On dev, test Booking.com offices send every room search to the Booking.com test property 10507360.
# rebecca@kom.com allows multi-room searches; 2 travellers = 2 rooms.

@ado:86399 @regression @provider:bookingcom
Feature: 86399 Booking.com - 2 rooms price is the same on the room page, in the cart and after booking
  As a corporate traveller booking Booking.com hotel rooms for two travellers
  I want the 2-room price to stay the same from the room page through to the booking
  So that I am charged the total I chose

  @priority:high
  Scenario: Booking.com 2 rooms, 1 guest per room - room page, cart and booked price match
    Given I am logged in as "rebecca@kom.com" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "Rita Hok"
    When I search for a hotel in "Edinburgh" for 1 night
    And I wait to see view rates text in results page
    And I select the first hotel result
    And I wait for the first add to trip button to be visible in room level results
    And I extract the price from room level results
    When I capture the "request" payload for request type "-accommodations-availability" from Storage
    Then the captured "request" payload for request type "-accommodations-availability" should contain the JSON:
      """
      {
        "guests": {
          "number_of_adults": 2,
          "number_of_rooms": 2,
          "allocation": [
            { "number_of_adults": 1 },
            { "number_of_adults": 1 }
          ]
        }
      }
      """
    When I add the first available room to my cart
    Then the cart should show 2 rooms badge
    And I fill credit card cvv if needed
    When I extract the total price of quote 1
    Then the extracted price at index 0 should equal the extracted price at index 1 within tolerance
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    When I extract the total price of quote 1
    Then I successfully cancel the trip
    And the extracted price at index 1 should equal the extracted price at index 2 within tolerance
