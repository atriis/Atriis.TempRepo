# Test Name: 23110 [Merge] Sunny Car - Verify that the terms and conditions are loading, invoice payment works correctly and validate is displayed
# Description: 
# Status: Active
# Labels: Cars,merge,Full Purchase,SunnyCars Regression,Pre Prod,FOP,Invoice,Terms and Conditions,Daily Transportation,progress page,Regression,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-26T04:04:28Z
# Updated: 2026-02-11T05:31:31Z
# ADO Test Case: #23110 - [Merge] Sunny Car - Verify that the terms and conditions are loading, invoice payment works correctly and validate is displayed

@transportation @cars @regression @provider:sunny @ado:23110 @booking
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
