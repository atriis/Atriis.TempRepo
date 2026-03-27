# Test Name: Corporate booker granted both privileges (Use New Flight Booking Flow & Use New Flights Pricing Options Screen) is directed to the new pricing screen
# Status: Active
# Labels: Regression,Privileges,New Flight Flow
# Owner: Sónia Sousa
# Created: 2026-02-18T08:29:40Z
# Updated: 2026-02-18T09:59:44Z

@regression @flights @general @new-flight-flow @privileges
Feature: Flights - Corporate booker with both new flight flow privileges sees new pricing screen
  As a corporate booker with both new flight booking flow privileges
  I want to be directed to the new pricing screen
  So that I can use the updated pricing options interface

  # TODO: New user needed — amadeus.reg.nff2pri@amsalem.com → USER_NFF2PRI
  # Add to .env: USER_NFF2PRI="amadeus.reg.nff2pri@amsalem.com"

  Scenario: Corporate booker with both privileges sees new pricing options view
    Given I am logged in as "nff2pri" booking a new trip
    And I have added myself as the traveler
    When I search for a round trip flight from "LON" to "LIS"
    # TODO: Step needed for "Validate new pricing options view is displayed"
