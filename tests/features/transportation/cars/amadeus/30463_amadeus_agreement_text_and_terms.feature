# Test Name: 30463 [Merge] Amadeus - Agreement text is displayed in the tooltip, book car and validate that the Terms & Conditions are displayed
# Description:
# Status: Active
# Labels: Regression,CR7,Cars,No Amadeus Hotel Book,Full Purchase,Amadeus,merge,Agreement,Terms and Conditions,progress page,Pre Prod,Transportation,2026 plan 1
# Owner: Bruna Santos
# Created: 2023-12-29T04:21:39Z
# Updated: 2025-07-30T03:23:50Z
# ADO Test Case: #30463 - [Merge] Amadeus - Agreement text is displayed in the tooltip, book car and validate that the Terms & Conditions are displayed

@transportation @cars @regression @provider:amadeus @ado:30463 @booking
Feature: 30463 - Amadeus Car - Agreement Text and Terms Conditions Displayed

  Scenario: User can view agreement text in tooltip and terms and conditions on booking
    Given I am logged in as "testim@amadeus.am" booking a new trip
    And I have added myself as the traveler
    When I search for a car at "LON" with rental agency "Enterprise" and 1 months ahead
    And I select the first city center pickup location
    Then the agreement text "Automation - ET - isPrePaid ON" should be displayed in the car results tooltip
    When I click on the terms and conditions link in the car results tooltip
    Then the terms and conditions modal should display the text "Remarks"
    And I close the terms and conditions modal
    When I add a car from city center results to cart
    And I click on the terms and conditions link in the cart
    Then the terms and conditions modal should display the text "Remarks"
    When I close the terms and conditions modal
    When I proceed to checkout
    And I complete the booking
    And the booking status should be "Confirmed"
    When I click on the terms and conditions link in the cart
    Then the terms and conditions modal should display the text "Remarks"
    Then I close the terms and conditions modal
    Then I successfully cancel the trip
