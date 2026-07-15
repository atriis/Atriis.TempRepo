# Test Name: 31010 Dynamic profile fields are shown for guest when TMC has role "Inherit dynamic profile fields questions from booker (guest only)"
# Description:
# Status: Active
# Labels: Regression,Dynamic fields,Role,Checkout,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-30T12:30:36Z
# Updated: 2025-03-17T11:41:27Z

@shell @reference_fields @dynamic_fields @regression @guest @checkout
Feature: 31010 - Dynamic profile fields are shown for a guest when the TMC has the inherit role

  As a booker booking for a guest
  I want the guest's dynamic profile fields to be shown at checkout when the TMC has the inherit role
  So that the guest's profile questions are inherited from the booker

  Scenario: Dynamic profile fields are displayed for the guest at checkout
    Given I am logged in as "caroldynamics@club.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LIS" to "NYC"
    When I add the first flight to cart
    And the booking status should be "Pending booking"
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should be visible:
    | DYNA PROF TST |
    | DYNAMIC PROFILE FIELDS TESTIM |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
