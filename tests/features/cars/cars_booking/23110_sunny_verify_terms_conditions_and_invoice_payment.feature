@transportation @cars @regression @provider:sunny
Feature: 23110 - Sunny Car - Verify Terms and Conditions and Invoice Payment

  Scenario: User can view terms and conditions and complete booking with invoice payment
    Given I am logged in as "automation@sunnycar.tlc" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LHR" with 1 months ahead
    And I add the first car to cart
    Then the payment type should be "Pre paid" 
    When I click on the terms and conditions link in the trip overview
    Then The terms and conditions modal should display the "Rental period" section
    When I close the terms and conditions modal
    When I proceed to checkout
    And I complete the booking
    And the booking status should be "Confirmed"
    Then I successfully cancel the trip
