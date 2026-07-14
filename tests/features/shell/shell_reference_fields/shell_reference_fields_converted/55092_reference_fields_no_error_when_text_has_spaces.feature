# Test Name: 55092 Reference Fields - Error is not triggered when text has spaces
# Description:
# Status: Active
# Labels: Regression,Reference Fields,Checkout,Daily Shell,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-12-04T12:02:44Z
# Updated: 2025-02-03T10:15:26Z

@shell @reference_fields @regression @checkout
Feature: 55092 - Reference field does not error when text contains spaces

  As a booker
  I want to enter reference field text that contains spaces
  So that spaces do not trigger a false validation error

  Scenario: Reference field accepts text containing spaces without error
    Given I am logged in as "monicasenna@reffieldtest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a one way flight from "LIS" to "MIA"
    When I add the first flight to cart
    When I proceed to checkout
    # TODO: implement step - verify the business reference field is displayed at checkout
    Then the reference field "business" is displayed
    # TODO: implement step - fill the reference field with a value containing spaces
    When I fill the reference field with "test with spaces"
    # TODO: implement step - was a Testim negative-element-validation; verify no validation error is triggered for text with spaces
    Then no validation error is triggered for the reference field
    When I open the cart
    # TODO: implement step - verify the quote status is "On hold"
    Then the quote status is "On hold"
    # TODO: implement step - cancel the quote from the cart after checkout
    Then I cancel the quote from the cart
