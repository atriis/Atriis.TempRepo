# Test Name: 68017 Cars - PNR remark "carDisplayCurrency"
# Labels: Cars, Full Purchase, Regression, Club, progress page
# Owner: Pedro Carneiro
# Created: 2025-09-26T05:12:07Z
# Updated: 2026-01-21T12:10:21Z

@regression @cars @full-purchase @pnr
Feature: 68017 Car PNR remark carDisplayCurrency validation

  As a traveler completing car booking
  I want the PNR remark to include the correct carDisplayCurrency
  So that the booking reflects the correct currency display

  Background:
    Given I am logged in as "cars@galileo.car" booking a new trip
    And I have added myself as the traveler

  @priority:high
  Scenario: Verify carDisplayCurrency remark in booked PNR
    When I search for a car at "LHR"
    And I add the first car to cart
    And I fill free text justification if needed
    And I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Complete traveler reference questions
    And I complete the booking
    Then the booking status should be "Confirmed"
    # TODO: Verify PNR contains carDisplayCurrency remark via API (DISPLAYGBP)
