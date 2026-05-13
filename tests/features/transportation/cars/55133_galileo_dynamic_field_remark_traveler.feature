# Test Name: 55133 Galileo - dynamic field send as remark with traveler connection
# Labels: Regression, Cars, Galileo, hybrid, Dynamic fields, remark, Full Purchase
# Owner: Shani Hadar
# Created: 2024-12-05T11:28:07Z
# Updated: 2025-09-02T09:58:20Z

@regression @cars @galileo @hybrid @full-purchase
Feature: 55133 Galileo dynamic field remark with traveler connection

  As a Galileo car traveler with multiple travelers
  I want dynamic field values to be included in the PNR remark
  So that rental details are connected to the correct traveler

  Background:
    Given I am logged in as "rafael@galileo.car" booking a new trip
    And I have added myself as the traveler
    And I have added traveler by name "rafi din"

  @priority:high
  Scenario: Verify dynamic field values sent as remark with traveler
    When I search for a car at "LHR"
    And I proceed after car search
    And I add the first car to cart
    # TODO: Fill mandatory dynamic fields (values: 7878, htht)
    And I accept Terms & Conditions
    And I proceed to checkout
    # TODO: Verify dynamic field values appear in checkout (7878, htht)
    And I complete the booking
    Then the booking confirmation should show "Confirmed"
