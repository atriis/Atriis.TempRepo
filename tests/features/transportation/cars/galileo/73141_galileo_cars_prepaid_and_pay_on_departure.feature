@transportation @cars @regression @provider:galileo
Feature: 73141 Galileo - Cars - PrePaid & Pay on Departure

  As a traveler
  I want to book cars with different payment methods
  So that I can choose the payment option that suits me

  Scenario: Book Galileo car with PrePaid
    Given I am logged in as "automation@galileo.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Enterprise" and 1 months ahead
    Then the payment type on results should be "Pre paid"
    When I add the first car to cart
    Then the payment type should be "Pre paid"
    And I proceed to checkout
    And I wait for booking details in checkout
    And I complete the booking
    When I click go to trip button
    Then the payment type should be "Pre paid"
    And I successfully cancel the trip

  Scenario: Book Galileo car with Pay On Departure
    Given I am logged in as "automation@galileo.gdg" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with rental agency "Avis" and 1 months ahead
    Then the payment type on results should be "Pay On Departure"
    When I add the first car to cart
    Then the payment type should be "Pay On Departure"
    And I proceed to checkout
    And I wait for booking details in checkout
    And I complete the booking
    When I click go to trip button
    Then the payment type should be "Pay On Departure"
    And I successfully cancel the trip