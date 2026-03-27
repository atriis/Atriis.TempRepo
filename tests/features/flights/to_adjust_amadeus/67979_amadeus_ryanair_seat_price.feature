# Test Name: 67979 Amadeus Light Ticketing - Ryanair - Total price in cart is correct after adding first outbound seat and then inbound seat
# Description:
# Status: Active
# Labels: Amadeus,Flights,Ryanair,Regression,price,Cart,Seating,Amadeus Light Ticketing,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-09-25T08:29:17Z
# Updated: 2025-10-27T01:47:13Z

@regression @flights @amadeus @ryanair @seating @price @light-ticketing
Feature: 67979 Amadeus Ryanair - Seat price calculation outbound and inbound
  As a corporate traveler
  I want the total cart price to update correctly when adding seats
  So that outbound and inbound seat prices are properly reflected

  Scenario: Cart total updates after adding outbound and inbound seats
    Given I am logged in as "lucas" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "STN" to "BUD"
    And I wait for add to trip text to be visible
    And I filter results by carrier "FR"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: Extract initial total, add outbound seat, verify price
    # Testim: Adding_seats_and_extracting_values()
    # opens seating → extracts total before seats → adds outbound seat → extracts seat price
    # TODO: Validate total = initial + outbound seat price
    # Testim: Checking_if_total_price_in_cart_is_correct_after_adding_seats(totalBeforeSeats, outboundSeat, totalAfterOutSeat)
    # TODO: Add inbound seat and extract combined seat prices
    # Testim: Adding_outbound_seat_and_extracting_values()
    # TODO: Validate total = initial + outbound + inbound seat prices
    # Testim: Validate_number1_number2_number3(totalBeforeSeats, outAndInbSeatPrices, totalAfterInbAndOutSeats)
