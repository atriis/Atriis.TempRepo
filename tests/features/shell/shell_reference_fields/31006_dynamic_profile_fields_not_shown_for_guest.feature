# Test Name: 31006 Dynamic profile fields are NOT shown for guest when TMC doesn't have the role of "Inherit dynamic profile fields questions from booker (guest only)"
# Description:
# Status: Active
# Labels: Dynamic fields,Regression,Checkout,Role,2026 plan 1
# Owner: Bruna Santos
# Created: 2025-01-24T08:53:51Z
# Updated: 2025-11-14T05:00:48Z

@shell @reference_fields @dynamic_fields @regression @guest @checkout
Feature: 31006 - Dynamic profile fields are not shown for a guest without the TMC inherit role

  As a booker booking for a guest
  I want the guest's dynamic profile fields hidden at checkout when the TMC lacks the inherit role
  So that guest profile questions are not shown without the role

  Scenario: Dynamic profile fields are not displayed for the guest at checkout
    Given I am logged in as "brunajuliana@sabretlcfaketest.com" booking a new trip
    And I have added a random guest traveler
    When I search for a one way flight from "LON" to "DOH"
    And I select the trip purpose as "BILLABLE" and proceed
    When I add the first flight to cart
    And the booking status should be "Pending booking"
    #And I select the first OOP justification option and save
    And I add a credit card as payment method
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the following checkout reference fields should not be visible:
    | DYN Checkout Sabre General Rm Corp |
    | DYN Profile Sabre General Rm Corp |
    | Employee ID |
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
