# Test Name: 36253 New UI - reference fields - Email validation
# Description: Fails if office id set to IsTest
# Status: Active
# Labels: CR7,Reference Fields,Regression,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-09-25T07:36:26Z
# Updated: 2026-02-17T06:52:15Z

@shell @reference_fields @regression @checkout
Feature: 36253 - Reference field email validation

  As a booker
  I want the email reference field to reject invalid emails and accept valid ones
  So that only well-formed email addresses are stored

  Scenario: Email reference field rejects an invalid email and accepts a valid one
    Given I am logged in as "email@test.nl" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "CPT"
    When I add the first car to cart
    When I proceed to checkout
    And I wait for booking details in checkout
    And I fill in the "Booker email" reference field with "email test"
    When I click book and finalize button
    Then the custom error "Please use a valid email address" should be displayed below the "Booker email" reference field
    And I fill in the "Booker email" reference field with "test.email@gov.nl"
    Then no validation error is triggered for the reference field
    And I navigate to cart from checkout
    And the booking status should be "Pending booking"
    And I successfully cancel the trip
