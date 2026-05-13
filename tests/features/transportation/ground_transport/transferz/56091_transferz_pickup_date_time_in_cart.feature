# Test Name: 56091 Transferz - Pickup date and time are displayed in cart page
# Description:
# Status: Active
# Labels: Transferz Regression,Cart,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-11-07T11:31:06Z
# Updated: 2025-12-17T08:50:26Z

@regression @transportation @ground_transport @provider:transferz @cart
Feature: 56091 Transferz - Pickup date and time are displayed in cart

  As a corporate traveler
  I want the selected Transferz pickup date and time to remain visible in cart
  So that I can confirm the booked transfer details before checkout

  Scenario: Transferz pickup date and time are displayed correctly in cart
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "lhr" to airport "stn" changing the pickup time
    And I wait for add to trip text to be visible
    And I add the first result to trip
    Then the booking status should be "Pending booking"
    And the ground transport pickup date and time should be displayed correctly in cart
