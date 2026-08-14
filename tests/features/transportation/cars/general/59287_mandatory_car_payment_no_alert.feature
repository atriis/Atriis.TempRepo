# Test Name: 59287 Cars - No Alert when Payment Mandatory
# Labels: Cars, SunnyCars Regression, Regression
# Owner: pini harush
# Created: 2025-03-13T08:52:10Z
# Updated: 2025-03-13T08:59:35Z

@regression @cars @sunnycars
Feature: 59287 59287 Cars - No alert when Payment Mandatory

  As a traveler with mandatory payment requirement
  I want to NOT see an optional payment alert

  @priority:high
  Scenario: Verify no optional payment alert when payment is mandatory
    Given I am logged in as "automation@sunnycar.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I add the first car to cart
    And the booking status should be "Pending booking"
    Then the car quote does not display the optional payment message "Payment method is optional you can proceed without it."
