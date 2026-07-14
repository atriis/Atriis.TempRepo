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
    # TODO: implement step - switch to the manual quote flow
    When I start a manual quote
    # TODO: implement step - create a manual hotel quote (city, dates, room type, confirmation number, room description)
    When I add a manual hotel quote in "london"
    # TODO: implement step - verify the manual quote status is "On hold"
    Then the quote status is "On hold"
    When I click the proceed to checkout button
    # TODO: implement step - verify the reference field label is displayed at checkout
    Then the reference field "BILLABLE OR NON BILLABLE" is displayed
    # TODO: implement step - select the dependent reference field value
    When I select the dependent reference field option
    # TODO: implement step - filter the dependent reference field by typing
    When I filter the dependent reference field by typing "33"
    # TODO: implement step - verify the dependent option is displayed
    Then the dependent reference field option is displayed
    # TODO: implement step - select the first dependent reference field option
    When I select the first dependent reference field option
    # TODO: implement step - verify the dependent reference field shows the value
    Then the dependent reference field shows the value "3"
    When I open the cart
    # TODO: implement step - verify the manual hotel quote shows nights in the cart
    Then the cart shows the hotel quote nights
    Then I successfully cancel the trip
