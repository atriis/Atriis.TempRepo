# Test Name: 65540 Transferz - validate "Booking code"
# Description:
# Status: Active
# Labels: Transferz Regression,Cart,Complete trip,Transportation,2026 plan 2
# Owner: Pedro Carneiro
# Created: 2025-08-13T05:13:11Z
# Updated: 2025-09-29T02:42:41Z
# Login: the Testim source ran as testim@transferez.am, a user that exists nowhere else in this
# repo. This scenario runs as betoribeiro@transferz.com instead - the Transferz user the other
# converted Transferz tests (54554 / 56091 / 62890) already book with. The booking code is a
# provider value, not a user-scoped one, so the assertion is unaffected.

@regression @transportation @ground_transport @provider:transferz @complete_trip
Feature: 65540 Transferz - Booking code is displayed across trip and share flows

  As a corporate traveler
  I want the Transferz booking code to be visible on the trip and share previews
  So that transfer confirmation data remains traceable after booking

  Scenario: Transferz booking code is shown on trip, share quote, and share itinerary
    Given I am logged in as "betoribeiro@transferz.com" booking a new trip
    And I have added myself as the traveler
    When I search for ground transport from airport "LHR" to specific address "Emirates"
    And I add the first result to trip
    And the booking status should be "Pending booking"
    And I fill ground transport contact details in cart
    And I proceed to checkout
    And I complete the booking
    Then the transfer booking code should be displayed on the trip
    When I click the share quote button
    Then the share quote preview should contain the transfer booking code
    And I close the share dialog
    When I click the share itinerary button
    Then the share itinerary preview should contain the transfer booking code
    And I close the share dialog
    And I successfully cancel the trip
