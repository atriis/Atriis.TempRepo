@transportation @cars @regression @daily_cars @provider:amadeus @priority:high @ado:74479 @wip
Feature: 75105 [Cars][GTP Admin] Is Prepaid Agreement Override Flag
  As a corporate traveler
  I want the car search results and cart to display the correct payment type
  based on the "Is Prepaid" flag configured in GTP Admin for my agreement

  # Pre-conditions (GTP Admin setup required before running these scenarios):
  #   Scenario 1: User's TMC-level Car Agreement must have "Is Prepaid" = true
  #   Scenario 2: User's Car Agreement must have "Is Prepaid" = false (default) and no billing number configured
  #
  # AC #3, #4, #5, #7 — Is Prepaid = true overrides unified rule; both results and cart show "Pre paid"
  @smoke
  Scenario: Is Prepaid = true on TMC agreement shows Pre paid on results and cart
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Enterprise" and 1 months ahead
    Then the payment type on results should be "Pre paid"
    When I add the first car to cart
    Then the payment type should be "Pre paid"

  # AC #6, #7 — Is Prepaid = false with no billing number falls back to unified rule → Pay On Departure
  @regression
  Scenario: Is Prepaid = false with no billing number shows Pay On Departure on results and cart
    Given I am logged in as "automation@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Enterprise" and 1 months ahead
    Then the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
