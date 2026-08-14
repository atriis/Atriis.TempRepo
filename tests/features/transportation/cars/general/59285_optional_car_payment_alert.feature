# Test Name: 59285 Cars - Add Alert when Payment Optional
# Labels: Cars, Full Purchase, Regression
# Owner: pini harush
# Created: 2025-03-13T08:31:37Z
# Updated: 2025-03-13T08:44:53Z

@regression @cars @full-purchase
Feature: 59285 Cars - Add Alert when Payment Optional

  As a traveler with optional payment configuration
  I want to see an alert when payment is optional
  So that I understand I can proceed without selecting a payment method

  @priority:high
  Scenario: Verify payment optional alert in cart
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I add the first car to cart
    And the booking status should be "Pending booking"
    When I click to edit the request billback extras section
    And I click the save button
    Then the car quote displays the optional payment message "Payment method is optional you can proceed without it."
