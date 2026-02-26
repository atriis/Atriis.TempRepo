# Test Name: HYBRID for 61652 expedia - send the traveler's phone in case valid, and the user group's phone in case not valid
# Description: 
# Status: Active
# Labels: Expedia,Hotel,Regression,traveler,hybrid,phone number,progress page,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-05-06T01:09:57Z
# Updated: 2025-07-10T04:55:01Z

@regression @provider:expedia
Feature: 61652 Expedia - Traveler phone used when valid, user group phone used when not valid
  As a corporate traveler whose phone number may be invalid
  I want the system to fall back to the user group's phone number when the traveler's phone is invalid
  So that hotel bookings always have a valid phone number submitted

  @priority:high
  Scenario Outline: Phone number used in booking is correct based on validity
    Given I am logged in as "expedia" "shani_corp_nl" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add the first available room to my cart
    Then the booking status should be "Pending booking"
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Create step "Then the phone number sent in the booking request should be <expected_phone>" - hybrid: validate via API/log that the <phone_source> phone was used
    When I cancel the trip

    Examples:
      | scenario                        | phone_source |
      | traveler with invalid phone     | user group   |
      | traveler with valid phone       | traveler     |
