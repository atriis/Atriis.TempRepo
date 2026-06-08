@transportation @cars @regression @provider:sabre
Feature: 73143 Sabre - Cars - Pay on Departure and Prepaid Payment Methods
 
  @smoke
  Scenario: Is Prepaid = true on TMC agreement shows Pre paid on results and cart
    Given I am logged in as "testim@testim.test" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Enterprise" and 1 months ahead
    Then the payment type on results should be "Pre paid"
    When I add the first car to cart
    Then the payment type should be "Pre paid"

  @regression
  Scenario: Is Prepaid = false with no billing number shows Pay On Departure on results and cart
    Given I am logged in as "testim@testim.test" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Hertz" and 1 months ahead
    Then the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
