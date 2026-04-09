# Test Name: 66119 Sunny Cars - Expired quote is not displayed in checkout summary
# Labels: Cars, Expiry, Checkout, SunnyCars Regression
# Owner: Bruna Santos
# Created: 2025-08-28T02:44:33Z
# Updated: 2025-12-17T08:42:36Z

@regression @cars @sunnycars @checkout @expiry
Feature: 66119 SunnyCars expired quote not in checkout

  As a SunnyCars traveler with an expired trip
  I want expired quotes to not appear in checkout summary
  So that only valid quotes are processed

  Background:
    Given I am logged in as "kaylesun" booking a new trip

  @priority:high
  Scenario: Verify expired SunnyCars quote hidden in checkout
    When I navigate to an expired trip
    And I search for a car from the cart
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I add credit card
    And I fill free text justification if needed
    And I accept Terms & Conditions
    And I proceed to checkout
    Then only one quote price should be displayed in checkout
    When I navigate to cart from checkout
    Then the booking status should be "Pending booking"
    And I cancel the pending booking quote
