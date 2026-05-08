@transportation @cars @regression @provider:amadeus
Feature: 64986 - Amadeus Cars Enterprise - Prepaid Text Display for Agreement Fares

  Scenario: Verify prepaid text is displayed for agreement fares when bill back is enabled
    Given I am logged in with an Amadeus enterprise account
    And bill back is enabled
    When I search for cars with agreement fares
    Then the "Prepaid" text should be displayed
    And it should indicate this is a prepaid option
