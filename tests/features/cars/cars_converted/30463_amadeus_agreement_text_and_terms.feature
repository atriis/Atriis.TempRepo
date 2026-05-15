@transportation @cars @regression @provider:amadeus
Feature: 30463 - Amadeus Car - Agreement Text and Terms Conditions Displayed

  Scenario: User can view agreement text in tooltip and terms and conditions on booking
    Given I am logged in with an Amadeus car provider account
    When I book a new trip
    And I add myself as the traveler
    And I search for cars
    Then the agreement text should be displayed in the tooltip
    When I book a car
    Then the terms and conditions should be displayed on the confirmation page
