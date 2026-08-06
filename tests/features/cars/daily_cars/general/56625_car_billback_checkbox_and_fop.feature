# Test Name: 56625 Car billback-allow checkbox/fop
# Labels: Cars, Regression, Sanity, Car billback
# Owner: pini harush
# Created: 2025-01-09T01:31:04Z
# Updated: 2025-09-02T07:22:48Z

@regression @cars @sanity @billback
Feature: 56625 Car billback checkbox and FOP validation

  As a corporate travel manager
  I want to verify billback options are correctly displayed in cart
  So that payment methods are properly managed

  @priority:high
  Scenario: Verify billback allow checkbox and FOP in cart
    Given I am logged in as "oop@regression.com" booking a new trip
    And I have added myself as the traveler
    When I initiate a car search at "MXP" with rental agency "Enterprise"
    And I click proceed button if visible
    And I add the first car to cart
    Then the booking status should be "Pending booking"
    When I click to edit the request billback extras section
    Then the corporate billing number is "18324496"
    When I click the "Apply to this quote" checkbox in the car billback section
    And I click the save button
    And the booking status should be "Pending booking"
    Then the add payment method button should be visible
    When I click to edit the request billback extras section
    Then the corporate billing number is "18324496"
    And I click the "Apply to this quote" checkbox in the car billback section
    And I click the save button
    And the booking status should be "Pending booking"
    Then the add payment method button should not be visible