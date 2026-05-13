# Test Name: 29776 baggage amount - before hold - with 1 baggage included - amadeus
# Description:
# Status: Active
# Labels: Flights,Regression,Amadeus,Travel policy,NL government,baggage,OOP,Full Purchase,progress page,2026 plan 1
# Owner: Shani Hadar
# Created: 2023-11-09T12:55:09Z
# Updated: 2025-12-09T08:27:59Z

@regression @flights @amadeus @baggage @oop @travel-policy
Feature: 29776 Amadeus - Baggage amount OOP with 1 baggage included
  As a corporate traveler
  I want to verify out-of-policy is triggered when adding extra baggage
  So that the travel policy for baggage is correctly enforced

  Scenario: Adding extra baggage triggers OOP and requires justification
    Given I am logged in as "shani@testimcorpnl.com" booking a new trip
    And I have added traveler by name "lary bagto"
    # TODO: Search round trip with far future dates (2 months ahead)
    # Testim: Copy_of_Search_flights_round_trip___for_far_dates('TLV', 'BUD')
    # Existing step may not support "far dates" variant
    When I search for a round trip flight from "TLV" to "BUD"
    And I click proceed on the reference fields popup
    # TODO: Filter by EL AL and add flight with 1 bag included
    # Testim: add_el_al_flight_with_1_bag() — filters "EL AL", adds to cart
    And I filter results by carrier "EL AL"
    And I add the first flight to cart
    # TODO: Validate no OOP indication initially
    # Testim: validate_there_is_no_oop_indication()
    Then the out of policy indicator should not be visible in cart
    # TODO: Add baggage and validate OOP is triggered
    # Testim: add_bagage_and_validate_oop() — adds extra bag, checks OOP appears
    # Need new step: When I add extra baggage to the flight
    # Then the out of policy indicator should be visible in cart
    # TODO: Validate OOP justification dropdown
    # Testim: validate_justification() — checks justification is required
    And I proceed to checkout
    And I complete the booking
    # TODO: Verify "Out of policy" badge visible on trip overview
    # Testim: waitForText(page, ".out-of-policy-badge", 'Out of policy')
    Then I successfully cancel the trip
