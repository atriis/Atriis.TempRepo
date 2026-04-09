# Test Name: 64409 In Progress Page > inProgress > "Confirmation in progress" - Confirmed > "Success"
# Labels: Cars, SunnyCars Regression, Regression, Benerail Moove Regression
# Owner: Pedro Carneiro
# Created: 2025-07-11T04:41:20Z
# Updated: 2026-01-19T07:46:47Z

@regression @cars @progress-page
Feature: 64409 Car booking progress page confirmation flow

  As a multi-product traveler
  I want to see confirmation progress through in-progress to success states
  So that I understand my booking status

  Background:
    Given I am logged in as "testim" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Complete car booking and view progress page confirmation
    When I have selected a rental agency
    And I search for a car at "LHR" with earlier date
    And I add the first car to cart as on-request
    Then the booking status should be "Pending booking"
    When I select payment method
    And I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Complete traveler reference questions
    And I complete the booking
    # TODO: Verify in-progress page shows confirmation flow with success state
