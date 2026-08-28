# Test Name: 62469 Bene> Rail Check-In Information and Requirement
# Description: existing trip 3492126 (as new trips with check in info are not common)
# to check the msg, button and time info
# Status: Active
# Labels: Cart,Benerail Moove Regression,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-05-22T06:34:25Z
# Updated: 2025-06-24T10:33:07Z
@wip @transportation @rails @benerail @regression
Feature: 62469 Benerail - Check-in information and requirement are shown in cart
  As a corporate traveler with a Benerail journey that requires check-in
  I want the cart to tell me check-in is required and expose the check-in details
  So that I know when and for which leg I have to check in before travelling

  # Trip 3492126 is a pre-existing trip: journeys that require check-in are rare, so the
  # source test pins a known one instead of booking a new trip for every run.
  Scenario: Check-in notice, button and leg availability time are displayed in the cart
    Given I am logged in as "bene@sncb.com"
    When I navigate to trip 3492126
    Then the check-in required notice should be visible in cart
    And the Check-in button should be visible in cart
    When I click the Check-in button in cart
    Then the check-in panel should show the Outbound leg
    And the check-in panel should show the Available from time
