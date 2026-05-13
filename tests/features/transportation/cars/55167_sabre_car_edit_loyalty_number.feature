# Test Name: 55167 Sabre car - can edit loyalty number after checkout
# Labels: Regression, Cars, Full Purchase, Car loyalty number, Sabre, hybrid, progress page
# Owner: Shani Hadar
# Created: 2024-12-08T06:03:31Z
# Updated: 2025-11-24T03:33:31Z

@regression @cars @sabre @hybrid @full-purchase @loyalty-number
Feature: 55167 Sabre car edit loyalty number after checkout

  As a Sabre car traveler
  I want to edit my loyalty number after checkout
  So that my loyalty account is associated with the booking

  Background:
    Given I am logged in as "berry@sabre.car" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Add loyalty number after Sabre car checkout
    When I search for a car at "LHR"
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I accept Terms & Conditions
    And I proceed to checkout
    And I complete the booking
    # TODO: Add/edit loyalty number in post-checkout screen
