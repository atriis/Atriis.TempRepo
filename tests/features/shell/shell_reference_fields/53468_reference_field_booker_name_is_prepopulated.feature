# Test Name: 53468 Reference Field - "Booker name" reference field is prepopulated
# Description:
# Status: Active
# Labels: Regression,Reference Fields,Checkout,2026 plan 1
# Owner: Bruna Santos
# Created: 2024-07-17T12:55:19Z
# Updated: 2025-07-30T02:48:18Z

@shell @reference_fields @regression @checkout
Feature: 53468 - "Booker Name" reference field is prepopulated

  As a booker
  I want the "Booker Name" reference field prepopulated with my name
  So that I do not have to type it manually

  Scenario: Booker Name reference field is prepopulated at checkout
    Given I am logged in as "jaque@specifictest.com" booking a new trip
    And I have added myself as the traveler
    When I search for a hotel in "LHR" for 1 night
    And I select the first hotel result
    And I add a refundable room to my cart
    And I fill in the OOP justification text "abc"
    When I proceed to checkout
    And I wait for booking details in checkout
    Then the reference fields should have the following values:
      | field       | value           |
      | Booker Name | Jaque Guerreiro |
    And I navigate to cart from checkout
    And I successfully cancel the trip
