# Test Name: 59285 Cars - Add Alert when Payment Optional
# Labels: Cars, Full Purchase, Regression
# Owner: pini harush
# Created: 2025-03-13T08:31:37Z
# Updated: 2025-03-13T08:44:53Z

@regression @cars @full-purchase
Feature: 59285 Optional car payment alert validation

  As a traveler with optional payment configuration
  I want to see an alert when payment is optional
  So that I understand I can proceed without selecting a payment method

  Background:
    Given I am logged in as "coreytaylor" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify payment optional alert in cart
    When I search for a car at "LHR"
    And I add the first car to cart
    Then I should see the message "Payment method is optional you can proceed without it."
