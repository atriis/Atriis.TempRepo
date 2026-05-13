# Test Name: 56201 car justifications are taken from car and general in the administration
# Labels: Regression, Travel policy, OOP, Cars, Cart, justification
# Owner: Shani Hadar
# Created: 2025-01-26T01:18:45Z
# Updated: 2025-01-26T01:30:38Z

@regression @cars @travel-policy @oop
Feature: 56201 Car justifications from administration

  As a corporate traveler with travel policy restrictions
  I want to see configured car justifications when out of policy
  So that I can understand why the car is flagged as restricted

  Background:
    Given I am logged in as "kerry@car.com" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify car and general justifications in OOP tooltip
    When I search for a car at "LHR"
    And I proceed after car search
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    # TODO: Click on OOP justification icon and verify tooltip displays configured texts:
    # - car justification text a
    # - car justification text b
    # - general a
    # - general b
