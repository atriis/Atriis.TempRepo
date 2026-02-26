# Test Name: 61677 - Travelodge - title validation
# Description: for book - waiting for test account
# Status: Active
# Labels: Regression,Travelodge,Hotel,No Amadeus Hotel Book,Cart,66444 hotel results,2026 plan 2
# Owner: Shani Hadar
# Created: 2025-08-10T06:20:20Z
# Updated: 2025-08-31T12:10:20Z

@regression @provider:travelodge
Feature: 61677 Travelodge - Title field required before proceeding to checkout
  As a corporate traveler booking a Travelodge hotel
  I want the title field to be validated before I can proceed
  So that Travelodge booking requirements are met

  @priority:high
  Scenario: Title field shows red border when empty and allows proceeding when filled
    Given I am logged in as "travelodge" "user_one" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    # TODO: Create step "Then the title field should show a red border indicating it is required" that calls DSL verifyTitleFieldRequired in Cart.js
    # TODO: Create step "When I fill in the title field" that calls DSL fillTitleField in Cart.js
    # TODO: Create step "Then the title field should show a green border indicating it is valid" that calls DSL verifyTitleFieldValid in Cart.js
    When I proceed to checkout
    And I complete the booking
    Then the booking status should be "Confirmed"

