# Test Name: 40952 MERGED Galileo car booking + travel policy for car + ECO car options
# Description:
# Status: Active
# Labels: Galileo,Cars,Full Purchase,Gray Dawes,Travel policy,OOP,Regression,Filters,No Amadeus Hotel Book,Sanity,Pre Prod,progress page,Transportation,2026 plan 1
# Owner: Shani Hadar
# Created: 2024-02-25T01:28:08Z
# Updated: 2025-07-10T04:07:14Z
@regression @cars @provider:galileo @transportation
Feature: 40952 Galileo car booking with travel policy and eco validations
  As a corporate traveler
  I want Galileo car results to reflect travel policy and eco indicators
  So that I can complete policy-compliant bookings with the correct justifications

  @priority:critical
  Scenario: Validate OOP state, eco options, justification flow, and successful booking
    Given I am logged in as "gal@carout.com" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "lhr"
    Then the out of policy indicator should be visible in results
    When I filter car results by the "Low emission cars" sustainability checkbox
    Then all car results should show the eco option tag "Eco Option"
    When I add the first car to cart
    And the booking status should be "Pending booking"
    Then the out of policy indicator should be visible in cart
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    When I fill in the OOP justification text "abc"
    And I click the proceed to checkout button once enabled
    And I send booking for approval
    Then the booking status should be "Confirmed"
    And I successfully cancel the trip
