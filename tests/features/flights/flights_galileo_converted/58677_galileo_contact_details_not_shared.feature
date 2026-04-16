# Test Name: HYBRID for 58677 Galileo - Flight - CTCE/CTCM are not being sent when "Don't share the contact details with airlines" checkbox is checked
# Status: Active
# Labels: Regression,Galileo,Flights,contact info,Full Purchase,hybrid,Checkout,progress page,Cancel by process,2026 plan 2
# Owner: Bruna Santos
# Created: 2025-02-26T01:17:01Z
# Updated: 2026-01-19T04:03:25Z

@regression @galileo @flights @contact_info @checkout @hybrid
Feature: 58677 Galileo - Contact details not shared when checkbox checked

  As a corporate traveler
  I want my contact details not to be sent to airlines when I check the opt-out box
  So that my privacy preference is respected

  Scenario: Booking with contact details sharing disabled
    Given I am logged in as "beatrizpamplonacorp" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "BSL" to "AMS"
    And I wait for flight results to be available
    And I filter results by carrier "KLM"
    And I add the first flight to cart
    And I proceed to checkout
    # TODO: Click__Don_t_share_the_contact_details_with_airlines_ — check the "Don't share" checkbox in checkout
    # Existing step candidate: When I uncheck contact sharing and edit the phone to "..."
    # But this test only checks the checkbox, doesn't edit phone
    Then the contact details checkbox should be unchecked by default
    When I complete the booking
    # TODO: Original test waits 60s after booking — backend verification that CTCE/CTCM are not sent
