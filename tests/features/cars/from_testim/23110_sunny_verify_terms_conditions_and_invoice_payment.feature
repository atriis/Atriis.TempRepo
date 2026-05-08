@transportation @cars @regression @provider:sunny
Feature: 23110 - Sunny Car - Verify Terms and Conditions and Invoice Payment

  Scenario: User can view payment terms and complete booking with TMC invoice
    Given I am logged in as "sunnycar" booking a new trip
    And I have added myself as the traveler
    
    When I search for a car at "LHR"
    And I add a car from city center results to cart
    
    Then the payment type should be "Pre paid"
    
    When I click on the payment terms link in the trip overview
    Then the rental period terms modal should be displayed
    When I close the terms modal
    
    And I accept Terms & Conditions
    And I click the proceed to checkout button
    And I complete the booking
    
    Then the booking should succeed
