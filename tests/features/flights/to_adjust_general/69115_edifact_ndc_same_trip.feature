# Test Name: 69115: Both quotes confirmed when booking EDIFACT and NDC in the same trip
# Status: Active
# Labels: Sabre,Sabre NDC,separate tickets,by schedule,Gray Dawes,Daily Flights,Flights,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2025-10-21T09:30:38Z
# Updated: 2025-11-04T07:13:59Z

@regression @flights @general @sabre @ndc @full-purchase
Feature: 69115 Flights - Both quotes confirmed when booking EDIFACT and NDC in same trip
  As a corporate traveler
  I want both EDIFACT and NDC quotes to be confirmed in a single trip
  So that mixed-supplier bookings work correctly

  # TODO: New user needed — 69059@regression.gdg → USER_69059
  # Add to .env: USER_69059="69059@regression.gdg"

  Scenario: EDIFACT and NDC booking in same trip are both confirmed
    Given I am logged in as "69059" booking a new trip
    And I have added a random guest traveler
    # TODO: Step needed for "Search flights and add to cart (by schedule with mixed suppliers)"
    And I proceed to checkout
    And I complete the booking
    # TODO: Step needed for "Validate both flights were booked (EDIFACT + NDC)"
    # TODO: Step needed for "Validate PNR created"
    Then I successfully cancel the trip
