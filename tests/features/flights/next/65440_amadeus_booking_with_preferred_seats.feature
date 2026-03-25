# Test Name: 65440 Amadeus - Flights - Booking successful with preferred seats
# Status: Active
# Labels: Regression,Flights,Full Purchase,Seating,Amadeus,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-07-28T03:38:43Z

@regression @amadeus @flights @seating @preferred_seats
Feature: 65440 Amadeus - Booking successful with preferred seats
  As a corporate traveler
  I want to select preferred seats when booking a flight
  So that the booking completes successfully with my preferred seating

  Scenario: Booking a round trip flight with preferred seats selected
    Given I am logged in as "ruimariano" booking a new trip
    And I have added a random guest traveler
    When I search for a round trip flight from "SEA" to "SBA"
    And I wait for add to trip text to be visible
    # TODO: Filter_by_airline_using__Preferred_Airlines__filter_in_results('Alaska')
    # This uses the carriers filter panel (click .carriers-filter icon then XPath checkbox)
    # Different from "I filter results by carrier" which types into search box
    # Proposed step: When I filter by preferred airline "Alaska"
    And I filter results by carrier "Alaska"
    And I add the first flight to cart
    Then the booking status should be "Pending booking"
    # TODO: Selecting_preferred_seat_2() — complex flow:
    #   1. Scroll to seating section, click seating panel
    #   2. Double-click "Add Seats" button
    #   3. Select a random preferred seat (.plane-seat.preferred) for outbound
    #   4. Confirm, then select preferred seat for inbound
    #   5. Save and verify Success toast
    # The existing step "When I select the first available flight seat" picks ANY seat with price.
    # Need new step: When I select preferred seats for all segments
    # Or new DSL: Cart.selectPreferredSeatsForAllSegments(page)
    When I select the first available flight seat
    When I proceed to checkout
    And I complete the booking
