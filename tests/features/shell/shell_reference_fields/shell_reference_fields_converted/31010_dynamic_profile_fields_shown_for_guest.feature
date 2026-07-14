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
    When I proceed to checkout
    # TODO: implement step - verify the "Travellers Reference Questions" section is displayed
    Then the "Travellers Reference Questions" reference section is displayed
    # TODO: implement step - verify the guest dynamic profile fields are displayed at checkout
    And the dynamic profile field "DYNA PROF TST" is displayed
    And the dynamic profile field "DYNAMIC PROFILE FIELDS TESTIM" is displayed
    When I open the cart
    # TODO: implement step - verify the quote status is "On hold"
    Then the quote status is "On hold"
    # TODO: implement step - cancel the quote from the cart after checkout
    Then I cancel the quote from the cart
