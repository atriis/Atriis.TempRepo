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
    # TODO: implement step - answer the reference fields and proceed
    When I answer the guest reference fields and proceed
    When I add the first flight to cart
    # TODO: implement step - select the dropdown justification in the cart if the item is out of policy
    When I select the justification in the cart if needed
    When I proceed to checkout
    # TODO: implement step - verify the checkout booking details page is displayed
    Then the checkout booking details are displayed
    # TODO: implement step - was a Testim negative-element-validation; verify the dynamic profile fields are not shown for the guest
    And the dynamic profile fields are not displayed for the guest
    When I open the cart
    # TODO: implement step - verify the quote status is "On hold"
    Then the quote status is "On hold"
    Then I successfully cancel the trip
