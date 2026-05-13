# Test Name: 64445 Galileo - Validate sampling process for on-request bookings
# Labels: Cars, Galileo, Regression
# Owner: Pedro Carneiro
# Created: 2025-07-15T04:10:50Z
# Updated: 2025-09-02T11:47:43Z

@regression @cars @galileo @on-request @hybrid
Feature: 64445 Galileo on-request booking sampling process

  As a Galileo on-request car traveler
  I want to validate the sampling process for on-request bookings
  So that I can confirm the booking flow is working correctly

  Background:
    Given I am logged in as "testim@car.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Validate Galileo on-request car booking sampling
    When I have selected a rental agency
    And I search for a car at "LHR"
    And I add the first car to cart as on-request
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Complete traveler reference questions
    And I complete the booking
    # TODO: Verify progress page displays in-progress state
    When I navigate to trips page
    Then the trip overview should be displayed
