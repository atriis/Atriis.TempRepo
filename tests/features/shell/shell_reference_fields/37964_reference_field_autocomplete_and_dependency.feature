# Test Name: 37964 Ref field auto complete and dependency
# Description:
# Status: Active
# Labels: Regression,Reference Fields,Manual Quote,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-11-06T09:59:16Z
# Updated: 2025-09-14T08:51:00Z

@shell @reference_fields @regression @manual_quote
Feature: 37964 - Reference field autocomplete and dependency

  As a booker creating a manual hotel quote
  I want dependent reference fields to autocomplete based on the selected value
  So that dependent options are filtered correctly

  Scenario: Dependent reference field autocompletes on a manual hotel quote
    Given I am logged in as "will@mref.com" booking a new trip
    And I have added myself as the traveler
    When I add a hotel manual quote in "Portland" for a single room
    Then the quote status is "On hold"
    When I click the proceed to checkout button
    And I wait for booking details in checkout
    When I type "YES" in reference field "BILLABLE OR NON BILLABLE" to select the first dropdown option
    And I type "33" in reference field "MATTER CODE CLIENT TRAVEL" to select the first dropdown option
    Then the reference fields should have the following values:
      | field       | value           |
      | BILLABLE OR NON BILLABLE | YES |
    And reference field "MATTER CODE CLIENT TRAVEL" should contain "3"
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
