@transportation @cars @regression @provider:sunny
Feature: 23110 - Sunny Car - Verify Terms and Conditions and Invoice Payment

  Scenario: User can view terms and conditions and complete booking with invoice payment
    Given I am logged in as "ruimariano" booking a new trip
    And I have added myself as the traveler
    
    When I search for a car at "LHR"
    
    When I add a car from city center results to cart
    
    When I proceed to checkout
    And I complete the booking
