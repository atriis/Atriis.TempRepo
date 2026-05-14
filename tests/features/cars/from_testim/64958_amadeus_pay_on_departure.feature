@transportation @cars @regression @provider:amadeus
Feature: 64958 - Amadeus Cars Enterprise - Pay on Departure Text Display

  Scenario: Verify pay on departure text is displayed for non-agreement fares
    Given I am logged in with an Amadeus enterprise account
    When I search for cars with non-agreement fares
    Then the "Pay on Departure" text should be displayed
    And it should be clear to the user this is pay on departure option
