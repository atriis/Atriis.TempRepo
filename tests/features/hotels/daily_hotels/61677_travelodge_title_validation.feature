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
    Given I am logged in as "tlgg" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LON" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    Then the booking status should be "Pending booking"
    Then the hotel should appear as refundable in cart
    Then the passenger title status should show "Title0/1"
    When I accept Terms & Conditions
    And I click the proceed to checkout button
    Then the cart should show the in order to proceed warning
    Then the passenger title should have a red error border
    When I add a passenger title
    Then the passenger title status should show "Title1/1"
    And the passenger title should have a green success icon
    And the passenger title should not have a red error border
    When I click the proceed to checkout button
    Then "Travellers Reference Questions" should be displayed in the checkout page
