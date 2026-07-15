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
    And I wait for booking details in checkout
    And I fill in the "Add Business Reason Or Customer Name" reference field with "test with spaces"
    Then no validation error is triggered for the reference field
    And I navigate to cart from checkout
    Then the booking status should be "On hold"
    And I successfully cancel the trip
