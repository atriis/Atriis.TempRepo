# Test Name: 59287 Cars - No Alert when Payment Mandatory
# Labels: Cars, SunnyCars Regression, Regression
# Owner: pini harush
# Created: 2025-03-13T08:52:10Z
# Updated: 2025-03-13T08:59:35Z

@regression @cars @sunnycars
Feature: 59287 Mandatory car payment no alert displayed

  As a traveler with mandatory payment requirement
  I want to NOT see an optional payment alert
  So that I understand payment is required to complete booking

  Background:
    Given I am logged in as "automation@sunnycar.tlc" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify no optional payment alert when payment is mandatory
    When I search for a car at "LHR"
    And I add the first car to cart
    # TODO: Verify optional payment alert is NOT displayed in cart
