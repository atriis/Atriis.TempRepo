# Test Name: Hybrid for 56121: Booking Details page - Booker and traveler contact info, with Pnr remark
# Status: Active
# Labels: uniglobe,Flights,contact info,Pnr Remarks,Regression,2026 plan 2
# Owner: Noam Miller
# Created: 2024-12-31T07:28:33Z
# Updated: 2025-07-25T09:48:02Z

@regression @flights @general @hybrid @checkout @contact-info
Feature: 56121 Flights - Booking details booker and traveler contact info with PNR remark
  As a corporate booker
  I want to see booker and traveler contact info on the booking details page
  So that all contact information is correctly captured with PNR remarks

  # TODO: New user needed — booker@mobile.uni → USER_BOOKER_MOBILE
  # Add to .env: USER_BOOKER_MOBILE="booker@mobile.uni"

  Scenario: Contact info and PNR remark are displayed in booking details
    Given I am logged in as "booker_mobile" booking a new trip
    And I have added myself as the traveler
    # TODO: Step needed for "Add second traveler by name 'Karoline Paxton'"
    When I search for a round trip flight from "OSL" to "ZRH"
    And I add the first flight to cart
    And I proceed to checkout
    # TODO: Step needed for "Validate booking page layout (traveler and booker contact info)"
    # TODO: Step needed for "Edit traveler contact info"
    And I complete the booking
