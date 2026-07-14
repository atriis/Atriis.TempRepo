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
    When I search for a one night hotel in "LON"
    When I add the first hotel room to cart
    # TODO: implement step - fill the free-text justification in the cart if the item is out of policy
    When I fill the free text justification in the cart if needed
    When I proceed to checkout
    # TODO: implement step - verify the "Booker Name" reference field is displayed
    Then the reference field "Booker Name" is displayed
    # TODO: implement step - verify the "Booker Name" reference field is prepopulated with the booker's name
    Then the reference field "Booker Name" shows the value "Jaque Guerreiro"
    When I open the cart
    Then I successfully cancel the trip
