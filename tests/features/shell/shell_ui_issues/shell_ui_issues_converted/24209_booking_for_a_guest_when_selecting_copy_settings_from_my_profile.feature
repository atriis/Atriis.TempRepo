# Test Name: 24209 Booking for a guest when selecting "Copy settings from - My Profile"
# Description:
# Status: Active
# Labels: Regression,Approval flow,Full Purchase,Profile,progress page,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-04-03T02:24:10Z
# Updated: 2025-04-04T08:26:01Z

@regression @shell @flights @approval_flow @profile
Feature: 24209 Booking for a guest when selecting "Copy settings from - My Profile"

  As a travel arranger
  I want to book a flight for a guest traveler whose settings are copied from my profile
  So that the approval flow inherits the correct approvers from my profile

  Scenario: Guest booking inherits approval flow with the expected approvers from the arranger profile
    Given I am logged in as "from@profile.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "SFO" to "IAH"
    And I wait for add to trip text to be visible
    And I filter results by carrier "UA"
    And I add the first flight to cart
    And the booking status should be "Pending booking"
    And I proceed to checkout
    And I complete the booking
    # TODO: open the approvers list from the trip overview share menu -> proposed step: When I view the approvers in the trip overview (DSL: hover share button, click first share-popper option to open approvers panel)
    # TODO: assert exactly 2 approvers are shown -> proposed step: Then the trip overview should show 2 approvers (DSL: count visible approver-name list items, expect 2)
    Then I successfully cancel the trip
