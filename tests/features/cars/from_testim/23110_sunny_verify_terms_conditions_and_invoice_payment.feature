@transportation @cars @regression @provider:sunny
Feature: 23110 - Sunny Car - Verify Terms and Conditions and Invoice Payment

  Scenario: User can view terms and conditions and complete booking with invoice payment
    Given I am logged in as "brunaalice@sunny.com"
    When I book a new trip
    And I add myself as the traveler
    And I search for cars in "LHR"
    Then car results should be displayed with "Add to trip" button
    When I check the terms and conditions
    And I add a car from results page to cart
    Then the booking should be pending with "Paid by TMC" option
    When I click on the payment terms link
    Then the rental period terms should be displayed
    When I close the terms dialog
    Then the booking should remain pending
    When I accept and proceed to checkout
    And I finalize the booking
    Then the booking should be completed
    When I click on the payment confirmation section
    Then the rental period terms should display
    When I close the terms dialog
    Then the status should show "Confirmed"
    And I should be able to validate the voucher
    And I can cancel the trip
