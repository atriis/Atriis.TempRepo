# Test Name: 66407 expiry counter> time left to book
# Description: test specific feature- 62769
# Status: Active
# Labels: Regression,Benerail Moove Regression,Expiry,Transportation,2026 plan 2
# Owner: pini harush
# Created: 2025-09-04T12:46:01Z
# Updated: 2025-09-04T01:07:22Z
@transportation @rails @benerail @regression
Feature: 66407 Benerail - Expiry counter shows time left to book in checkout
  As a corporate traveler
  I want to see the time left to book counter in the checkout page
  So that I know how long I have before the Benerail quote expires

  Scenario: Time left to book counter is visible in Benerail checkout and within the booking window
    Given I am logged in as "beny@moove.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way Benerail train from "bebmiToSchiphol"
    And I click proceed button if visible
    When I add a Benerail one way to the trip
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the time left to book counter should be visible in the Benerail checkout showing between 18 and 20 minutes
