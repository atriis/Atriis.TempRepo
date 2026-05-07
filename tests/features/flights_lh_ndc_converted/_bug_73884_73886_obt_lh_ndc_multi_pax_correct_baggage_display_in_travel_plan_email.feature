# Test Name: *** BUG 73884 *** 73886: OBT - LH NDC - Multi pax, Correct baggage display in travel plan email
# Description:
# Status: Active
# Labels: Amsalem,Lufthansa NDC Regression,multi pax,baggage,Email
# Owner: Noam Miller
# Created: 2026-02-15T02:55:47Z
# Updated: 2026-02-15T03:40:39Z

@regression @flights @ndc @lufthansa @baggage @multi-pax @email @bug
Feature: 73884 Lufthansa NDC - Multi pax correct baggage display in travel plan email

  As a corporate traveler
  I want to book a multi-passenger Lufthansa NDC flight with paid baggage
  So that I can verify the baggage is correctly displayed in the travel plan email

  Scenario: Book a multi-pax LH NDC flight with paid baggage and verify email baggage display
    Given I am logged in as "lh_ndc_pax" booking a new trip
    And I have added a random guest traveler
    And I have added a random guest traveler
    And I have added a random guest traveler
    When I search for a round trip flight from "LHR" to "VIE"
    Then flight results should be available

    # Add first flight to cart
    When I add the first flight to cart
    And I handle conflicting quotes if visible
    Then the booking status should be "Pending booking"

    # Select paid baggage for 2nd passenger
    # TODO: Implement step "I select paid baggage for the 2nd passenger" — open baggage section, switch to 2nd pax tab, select baggage option, select route, click save on overview tab, verify '.flight-baggage .filled' visible

    # Validate baggage in email (before hold)
    # TODO: Implement step "the travel plan email should display correct baggage for all passengers" — click email tab, verify email shows 'LH NDC AIGB', verify baggage rows show '1PC' for pax 1 and 3, '1PC, ADDITIONAL BAGGAGE' for pax 2 (both outbound and return segments)

    # Accept T&C and hold
    When I accept Terms & Conditions
    And I hold the trip

    # Validate baggage in email (after hold)
    # TODO: Implement step "the travel plan email should display correct baggage for all passengers after hold" — same validation as above but after hold status

    # Cancel the trip
    Then I successfully cancel the trip
