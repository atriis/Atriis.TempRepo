# Test Name: 73482 Amadeus - Cars - Verify that the terms/fare rules are loading in results, cart and checkout
# Labels: Cars, Full Purchase, Regression, Daily Transportation
# Owner: Pedro Carneiro
# Created: 2026-02-06T03:48:26Z
# Updated: 2026-02-06T04:48:38Z

@regression @cars @amadeus @full-purchase @daily-transportation
Feature: 73482 Amadeus - Cars - Verify that the terms/fare rules are loading in results, cart and checkout

  As an Amadeus car traveler
  I want to see fare rules and terms displayed correctly at each booking stage
  So that I understand the full pricing terms before committing

  @priority:high
  Scenario: Verify Amadeus car fare rules display in results, cart, and checkout
    Given I am logged in as "pmac@corp.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR"
    And I wait for add to trip text to be visible
    And I click on the terms and conditions link in the car results
    Then The terms and conditions modal should display the "Charge" section
    And The terms and conditions modal should display the "Coverage" section
    And The terms and conditions modal should display the "Remarks" section
    And I close the terms and conditions modal
    When I add the first car to cart
    And the booking status should be "Pending booking"
    And I fill in the OOP justification text "abc"
    When I click on the terms and conditions link in the cart
    Then The terms and conditions modal should display the "Charge" section
    And The terms and conditions modal should display the "Coverage" section
    And The terms and conditions modal should display the "Remarks" section
    And I close the terms and conditions modal
    And I proceed to checkout
    And I complete the booking
    And the booking status should be "Confirmed"
    When I click on the terms and conditions link in the cart
    Then The terms and conditions modal should display the "Charge" section
    And The terms and conditions modal should display the "Coverage" section
    And The terms and conditions modal should display the "Remarks" section
    And I close the terms and conditions modal
    And I successfully cancel the trip
